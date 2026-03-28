provider "aws" {
  region = "us-east-2" # <--- Alterado para Ohio
}

# 1. Busca a rede padrão em Ohio
data "aws_vpc" "default" { default = true }
data "aws_subnets" "default" {
  filter { name = "vpc-id", values = [data.aws_vpc.default.id] }
}

# 2. Roles de Execução (Obrigatório)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole-Aula-Ohio"
  assume_role_policy = jsonencode({
    Version = "2012-10-17", Statement = [{ Action = "sts:AssumeRole", Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# 3. Cluster ECS em Ohio
resource "aws_ecs_cluster" "main" {
  name = "cluster-aula-devops"
}

# 4. Definição da Tarefa
resource "aws_ecs_task_definition" "app" {
  family                   = "node-app-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "node-app"
      # Mantenha a URL do ECR onde você fez o push (us-east-1ou us-east-2)
      image = "582260131066.dkr.ecr.us-east-2.amazonaws.com/meu-app-node:latest"
      portMappings = [{ containerPort = 3000, hostPort = 3000 }]
    },
    {
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

# 5. Serviço em Ohio
resource "aws_ecs_service" "main" {
  name            = "node-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    assign_public_ip = true
  }
}