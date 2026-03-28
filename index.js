// index.js
require('dd-trace').init({
  logInjection: true // Isso liga o Log com o Trace (essencial para a IA)
});

const express = require('express');
const app = express();

app.use(express.json());
// Serve o seu arquivo HTML automaticamente (ele deve se chamar index.html)
app.use(express.static('.'));

let listaAlunos = [
  { id: 1, nome: "Rodrigo Arruda" }
];

// Rota padrão para listar
app.get('/pessoas', (req, res) => {
  logger("listando pessoas")
  res.json(listaAlunos);
});

// Rota para cadastrar (POST)
app.post('/pessoas', (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

  const novoAluno = { id: Date.now(), nome };
  listaAlunos.push(novoAluno);

  logger("criando pessoas")

  res.status(201).json(novoAluno);
});

// --- ROTAS DE DEMONSTRAÇÃO DE CLOUDOPS ---

// 1. Simulação de Erro Fatal (Auto-healing do ECS)
app.get('/quebrar', (req, res) => {
  logger("Derrubando app")

  console.log("!!! ERRO CRÍTICO: Encerrando processo !!!");
  res.status(500).send("A aplicação caiu! O ECS vai subir outra em breve.");
  process.exit(1); 
});

// 2. Simulação de Stress de Memória (Auto-scaling da AWS + Datadog)
let vazamento = [];
app.get('/stress-memoria', (req, res) => {

  logger("stress memoria")

  console.log("Iniciando consumo massivo de memória...");
  // Cria um loop que ocupa a RAM rapidamente
  for (let i = 0; i < 1000000; i++) {
    logger("stress memoria ")

    vazamento.push({ dado: new Array(100).fill("STRESS_TEST"), id: i });
  }
  res.json({ status: "Memória sendo drenada!", tamanho: vazamento.length });
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));