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


//chave publica

/* cadastrar no vps

ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG0tydCMTjk/xi/OMqQfoL6qcnhqzzf89aR7uX7M64wq deploy-alunos




-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBtLcnQjE45P8YvzjKkH6C+qnJ4as83/PWke7l+zOuMKgAAAJBwkfRvcJH0
bwAAAAtzc2gtZWQyNTUxOQAAACBtLcnQjE45P8YvzjKkH6C+qnJ4as83/PWke7l+zOuMKg
AAAEDPxDWLIYZzHBLE34Tky4RGSfoQBcdOyItPBC3FwpbqVG0tydCMTjk/xi/OMqQfoL6q
cnhqzzf89aR7uX7M64wqAAAADWRlcGxveS1hbHVub3M=
-----END OPENSSH PRIVATE KEY-----

*/


/*

Opção mais simples: GitHub Actions → SSH no VPS → docker compose up -d.

No VPS, tenha seu app em um diretório (ex.: /opt/app) com docker-compose.yml e (se precisar) .env.
Crie um usuário/remote de deploy (você já tem deploy) e use uma chave só para CI (separada da sua).
No GitHub: Settings → Secrets and variables → Actions e crie VPS_HOST=148.230.73.243, VPS_USER=deploy, VPS_KEY (chave privada da CI), e APP_DIR=/opt/app.
Exemplo de workflow .github/workflows/deploy.yml:

*/