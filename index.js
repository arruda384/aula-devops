const express = require('express');
const app = express();

// Middleware para entender JSON no corpo da requisição
app.use(express.json());
// Serve arquivos estáticos (para a sua tela HTML)
app.use(express.static('.'));

// A variável que "limpa" quando o servidor reinicia
let listaAlunos = [
  { id: 1, nome: "Rodrigo Arruda" }
];

// Rota para listar
app.get('/alunos', (req, res) => {
  res.json(listaAlunos);
});

// Rota para adicionar (POST)
app.post('/alunos', (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });

  const novoAluno = { id: Date.now(), nome };
  listaAlunos.push(novoAluno);
  
  res.status(201).json(novoAluno);
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));