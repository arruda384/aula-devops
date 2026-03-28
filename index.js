// 1. O dd-trace deve ser SEMPRE a primeira linha
require('dd-trace').init({
  logInjection: true 
});

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// FUNÇÃO DE LOG: Formata a saída para o Datadog entender como JSON
const logger = (level, message, metadata = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: message,
    service: "node-app", // Nome do seu serviço
    ...metadata
  };
  console.log(JSON.stringify(logEntry));
};

let listaAlunos = [
  { id: 1, nome: "Rodrigo Arruda" }
];

// Rota padrão para listar
app.get('/pessoas', (req, res) => {
  // Log de Informação
  logger("info", "Listando alunos", { count: listaAlunos.length });
  res.json(listaAlunos);
});

// Rota para cadastrar (POST)
app.post('/pessoas', (req, res) => {
  const { nome } = req.body;
  
  if (!nome) {
    // Log de Erro (Bad Request)
    logger("error", "Tentativa de cadastro sem nome", { status: 400 });
    return res.status(400).json({ error: "Nome é obrigatório" });
  }

  const novoAluno = { id: Date.now(), nome };
  listaAlunos.push(novoAluno);

  // Log de Sucesso com metadados do aluno
  logger("info", "Novo aluno cadastrado", { aluno_id: novoAluno.id, nome_aluno: nome });
  res.status(201).json(novoAluno);
});

// --- ROTAS DE DEMONSTRAÇÃO DE CLOUDOPS ---

// 1. Simulação de Erro Fatal (Auto-healing)
app.get('/quebrar', (req, res) => {
  logger("error", "CRITICAL: Encerrando processo por solicitação externa", { exit_code: 1 });
  
  res.status(500).send("A aplicação caiu! O ECS vai subir outra em breve.");
  
  // Pequeno delay para garantir que o log seja enviado antes do processo morrer
  setTimeout(() => {
    process.exit(1); 
  }, 500);
});

// 2. Simulação de Stress de Memória (Auto-scaling)
let vazamento = [];
app.get('/stress-memoria', (req, res) => {
  logger("warn", "Iniciando consumo massivo de memória para teste de scaling", { 
    mem_antes: process.memoryUsage().heapUsed 
  });

  for (let i = 0; i < 1000000; i++) {
    vazamento.push({ dado: new Array(100).fill("STRESS_TEST"), id: i });
  }

  logger("info", "Stress de memória concluído", { 
    tamanho_lista: vazamento.length,
    mem_depois: process.memoryUsage().heapUsed 
  });
  
  res.json({ status: "Memória sendo drenada!", tamanho: vazamento.length });
});

app.listen(3000, () => {
  logger("info", "Servidor rodando na porta 3000");
});