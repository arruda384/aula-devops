const express = require('express');
const app = express();
const PORT = 3000;

// Rota 1: Inicial
app.get('/', (req, res) => {
  res.json({ message: "API voando! 🚀", status: "online" });
});

// Rota 2: Teste de Deploy
app.get('/deploy', (req, res) => {
  res.json({ 
    message: "Deploy automático com Docker funcionando!",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

