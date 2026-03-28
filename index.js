const axios = require('axios'); // Adicione isso no topo do arquivo

// index.js
require('dd-trace').init({
  logInjection: true // Crucial: injeta span_id e trace_id nos logs
});

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Função simples para logar em formato JSON (Melhor para Datadog/CloudWatch)
const logger = (level, message, metadata = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: message,
    ...metadata
  };
  console.log(JSON.stringify(logEntry));
};

let listaAlunos = [
  { id: 1, nome: "Rodrigo Arruda" }
];

// 1. Log de Inicialização
logger("info", "Aplicação Iniciada", { port: 3000, environment: "production" });

app.get('/pessoas', (req, res) => {
  // Log de Info: Rastreando acessos
  logger("info", "Lista de alunos solicitada", { count: listaAlunos.length });
  res.json(listaAlunos);
});

app.post('/pessoas', (req, res) => {
  const { nome } = req.body;
  
  if (!nome) {
    // Log de Erro: Tentativa inválida
    logger("error", "Falha ao cadastrar: Nome ausente", { status: 400 });
    return res.status(400).json({ error: "Nome é obrigatório" });
  }

  const novoAluno = { id: Date.now(), nome };
  listaAlunos.push(novoAluno);

  // Log de Sucesso
  logger("info", "Novo aluno cadastrado", { aluno_id: novoAluno.id, nome: nome });
  res.status(201).json(novoAluno);
});

// --- ROTAS DE DEMONSTRAÇÃO DE CLOUDOPS ---

app.get('/quebrar', (req, res) => {
  // Log Crítico antes da queda
  logger("error", "CRITICAL: Encerrando processo via rota /quebrar", { exit_code: 1 });
  
  res.status(500).send("A aplicação caiu! O ECS vai subir outra em breve.");
  
  setTimeout(() => {
    process.exit(1);
  }, 500); // Pequeno delay para garantir que o log seja enviado
});

let vazamento = [];
app.get('/stress-memoria', (req, res) => {
  // Log de Alerta
  logger("warn", "Iniciando teste de stress de memória", { current_heap: process.memoryUsage().heapUsed });

  for (let i = 0; i < 1000000; i++) {
    vazamento.push({ dado: new Array(100).fill("STRESS_TEST"), id: i });
  }

  logger("info", "Stress concluído", { itens_em_memoria: vazamento.length });
  res.json({ status: "Memória sendo drenada!", tamanho: vazamento.length });
});

let alunosTestes = [];
app.get('/cadastrolote', (req, res) => {
  // Log de Alerta
  logger("warn", "Iniciando teste de stress de memória", { current_heap: process.memoryUsage().heapUsed });

  for (let i = 0; i < 100; i++) {
    alunosTestes.push({ dado: new Array(100).fill("STRESS_TEST"), id: i });
  }

  logger("info", "Stress concluído", { itens_em_memoria: alunosTestes.length });
  res.json({ status: "Memória sendo drenada!", tamanho: alunosTestes.length });
});

app.listen(3000, () => {
  logger("info", "Servidor escutando na porta 3000");
});



// ... (resto do seu código anterior)

// NOVA ROTA: Gerador de Carga (Loop de N vezes)
// Exemplo de uso: /stress-carga/100 (vai cadastrar 100 alunos)
app.get('/stress-carga/:qtd', async (req, res) => {
  const qtd = parseInt(req.params.qtd);
  
  if (isNaN(qtd) || qtd <= 0) {
    logger("error", "Quantidade inválida para stress de carga", { valor: req.params.qtd });
    return res.status(400).json({ error: "Informe um número válido maior que zero." });
  }

  logger("warn", `Iniciando loop de carga: ${qtd} cadastros`, { 
    tipo: "Stress Test",
    solicitante: "Rodrigo Arruda" 
  });

  let sucessos = 0;
  let falhas = 0;

  // Loop para chamar a rota POST N vezes
  for (let i = 1; i <= qtd; i++) {
    try {
      // Fazendo o POST para a própria aplicação (localhost:3000)
      await axios.post('http://localhost:3000/pessoas', {
        nome: `Aluno Teste ${i} - ${Date.now()}`
      });
      sucessos++;
    } catch (error) {
      falhas++;
      logger("error", "Falha em uma das requisições do loop", { erro: error.message });
    }
  }

  const resultado = {
    mensagem: "Carga finalizada",
    solicitados: qtd,
    processados: sucessos,
    erros: falhas
  };

  logger("info", "Resultado do stress de carga", resultado);
  res.json(resultado);
});

// ... (app.listen)