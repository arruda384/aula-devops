# 1. PROVIDER: Define que vamos usar a nuvem AWS na região de Ohio.
provider "aws" {
  region = "us-east-2" 
}


# 2. NETWORKING: Busca a rede (VPC) e as Subnets padrão da conta.
# Isso evita que precisemos digitar IDs manuais e torna o código portátil.
data "aws_vpc" "default" { default = true }
data "aws_subnets" "default" {
  filter { 
    name = "vpc-id"
    values = [data.aws_vpc.default.id] 
  }
}

# 3. SEGURANÇA (IAM): Cria a "identidade" que o ECS usará.
# Sem isso, o ECS não tem permissão para baixar sua imagem do ECR ou enviar logs.
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole-Aula-Ohio"
  assume_role_policy = jsonencode({
    Version = "2012-10-17", Statement = [{ 
      Action = "sts:AssumeRole", 
      Effect = "Allow", 
      Principal = { Service = "ecs-tasks.amazonaws.com" } 
    }]
  })
}

# Anexa a política oficial da AWS para execução de tarefas ECS à Role criada acima.
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# 4. CLUSTER: O agrupamento lógico onde os containers vão rodar.
resource "aws_ecs_cluster" "main" {
  name = "cluster-aula-devops"
}

# 5. TASK DEFINITION: O "blueprint" ou planta da sua aplicação.
# Define quanto de CPU/Memória e quais containers subiremos (Sidecar Pattern).
resource "aws_ecs_task_definition" "app" {
  family                   = "node-app-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"] # Serverless: não gerenciamos servidores.
  cpu                      = "256"        # 0.25 vCPU
  memory                   = "512"        # 512MB de RAM
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      # Container 1: Sua API Node.js
      name  = "node-app"
      image = "582260131066.dkr.ecr.us-east-2.amazonaws.com/meu-app:latest"
      portMappings = [{ containerPort = 3000, hostPort = 3000 }]
    },
    {
      # Container 2 (Sidecar): Agente do Datadog para monitoramento
      name  = "datadog-agent"
      image = "gcr.io/datadoghq/agent:7"
      environment = [
        { name = "DD_API_KEY", value = "82a58657981ee1660daa32782df37e58" },
        { name = "DD_SITE", value = "datadoghq.com" },
        { name = "DD_ECS_FARGATE", value = "true" }
      ]
    }
  ])
}

# 6. SERVICE: O gerente que garante que a Task esteja sempre rodando.
resource "aws_ecs_service" "main" {
  name            = "node-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1 # Mantém sempre 1 cópia viva (Auto-healing se a rota /quebrar for usada)
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    assign_public_ip = true # Gera um IP público para acessarmos a API
  }
}

# 7. AUTO SCALING: A inteligência de elasticidade da nuvem.
# Define que podemos crescer de 1 até 3 instâncias automaticamente.
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 3
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Regra de Escalonamento baseada em Memória.
# Se a rota /stress-memoria for usada e passar de 50%, a AWS sobe nova Task.
resource "aws_appautoscaling_policy" "memory_policy" {
  name               = "scale-on-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 50.0 
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}