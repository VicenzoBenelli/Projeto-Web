# Estado inicial (ainda não é o README definitivo)
O bootstrap foi inspecionado e o gate V01 foi executado em Windows com Node 22. As evidências da onda, limitações e transferência ficam em `docs/EVIDENCIAS-ONDA-01.md`.

Cópia .env: copiar `.env.example` para `.env` e `api/.env.example` para `api/.env` no PowerShell. Substituir JWT_SECRET por segredo aleatório antes de iniciar a API. Não versionar .env.
Instalação: npm install na raiz. Testes previstos: npm run build -w shared; npm run build -w api; npm run build -w frontend. O PostgreSQL requer Docker instalado e em execução.

**Atenção:** o professor exige um README final com vídeo, integrantes e passo a passo; este arquivo não o substitui.
