# Camada — site conectado ao Google Sheets

Comece pelo arquivo **LEIA-PRIMEIRO.html**: abra com dois cliques para ver o passo a passo completo, gerar sua senha e copiar o conector do Google.

O mesmo roteiro está em [PASSO-A-PASSO.md](PASSO-A-PASSO.md).

Esta é a versão 2: cadastros são gravados diretamente na planilha após a configuração. Não use as instruções nem o server.js da versão anterior.

Publicação: Vercel, preset Other, build npm run build, saída public. As variáveis APP_PASSWORD, SHEETS_URL e SHEETS_TOKEN são obrigatórias. Veja o guia antes de publicar.

Testes locais: npm test. Desenvolvimento: npm run dev com .env.local configurado. Nenhuma dependência externa precisa ser instalada para os testes ou o build.
