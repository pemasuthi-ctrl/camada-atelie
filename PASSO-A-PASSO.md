# Colocar o Camada para salvar no Google Sheets

Você preenche o site e ele grava na planilha. Ao abrir em outro dispositivo, ele lê os mesmos dados. A configuração abaixo é feita uma vez. Não precisa instalar programas no computador.

Abra também **LEIA-PRIMEIRO.html** com dois cliques: ele contém este guia, um gerador de senha/chave e o código do conector pronto para copiar.

## 1. Criar a planilha

1. Entre em https://sheets.google.com e clique em **Em branco**.
2. Dê o nome **Gestão do ateliê 3D**.
3. Mantenha a planilha privada. As colunas serão criadas pelo conector.

## 2. Colocar o conector no Google

1. Na planilha, abra **Extensões → Apps Script**.
2. No arquivo **Código.gs / Code.gs**, apague o conteúdo inicial.
3. No guia HTML, abra **Código do conector**, copie todo o texto e cole no editor. É o mesmo conteúdo de `google-sheets/Code.gs` no pacote.
4. Salve e nomeie o projeto **Conector Camada**.
5. Ao lado de **Executar**, selecione a função **prepararPlanilha** e execute-a.
6. Autorize o acesso solicitado usando a conta que criou a planilha. Se houver aviso de app não verificado, confira que é o **Conector Camada** que você acabou de criar antes de continuar.
7. Volte à planilha: confira as abas **Vendas**, **Produtos** e **Financeiro**, com cabeçalhos. Não execute `doPost` pelo editor.

## 3. Guardar a chave da conexão

1. No guia HTML, clique em **Gerar chave e senha**. Guarde ambos no seu gerenciador de senhas. São gerados no navegador, sem envio a terceiros.
2. A **chave da conexão** serve para ligar o Google à Vercel. A **senha do site** serve para você entrar no Camada. São diferentes.
3. No Apps Script, abra a **engrenagem → Configurações do projeto → Propriedades do script → Adicionar propriedade**.
4. Em **Propriedade**, digite `CAMADA_TOKEN`.
5. Em **Valor**, cole a chave da conexão gerada no guia e salve.

Se já existir `CAMADA_SHEET_ID`, não altere: foi criado automaticamente. Não coloque senhas ou chaves dentro do código ou no GitHub.

## 4. Publicar o conector

1. No Apps Script: **Implantar → Nova implantação → engrenagem → App da Web**.
2. Em **Executar como**, escolha **Eu**.
3. Em **Quem pode acessar**, escolha **Qualquer pessoa**, sem exigir conta Google.
4. Clique em **Implantar** e conclua a autorização, se solicitada.
5. Copie a **URL do app da Web**, terminada em `/exec`. Não use o ID da implantação, a URL do editor nem uma URL terminada em `/dev`.

A planilha permanece privada. O conector só lê e grava com a chave correta, guardada no servidor da Vercel. Se a opção Qualquer pessoa não estiver disponível, sua conta de trabalho/escola pode exigir liberação do administrador; escolher outra opção não resolve esta integração.

## 5. Enviar o projeto ao GitHub

1. Extraia o **ZIP atualizado**. Não use o pacote da versão anterior.
2. No GitHub, clique no **+ → New repository**.
3. Nome: **camada-atelie**. Escolha **Private**, marque **Add a README file** e clique em **Create repository**.
4. Abra **Add file → Upload files**.
5. Na pasta extraída, abra `atelie3d` e arraste **o conteúdo dela** para o GitHub, incluindo as pastas `api`, `lib`, `scripts` e `google-sheets`. Não envie o ZIP como um único arquivo.
6. Clique em **Commit changes**.
7. Confira que `package.json`, `vercel.json` e `index.html` aparecem na página inicial do repositório, junto às pastas `api`, `lib` e `scripts`.

Se estiver atualizando o repositório antigo, substitua os arquivos e **apague o antigo server.js da raiz**. Ele não faz parte desta versão. Não basta atualizar somente app.js.

## 6. Publicar na Vercel

1. Entre em https://vercel.com com sua conta GitHub.
2. Clique em **Add New… → Project**.
3. Em **camada-atelie**, clique em **Import**. Se o repositório não aparecer, use **Adjust GitHub App Permissions** para dar acesso a ele.
4. Em **Framework Preset**, escolha **Other**.
5. Deixe **Root Directory** como `.` (raiz). Isso pressupõe que os arquivos estão na raiz, como na etapa 5.
6. Confira **Build Command = `npm run build`** e **Output Directory = `public`**. O arquivo vercel.json já define esses valores; se a tela pedir, ative a substituição e preencha. Deixe Install Command no padrão.
7. Abra **Environment Variables** e adicione estas três variáveis, com os nomes exatamente assim:

| Nome | O que colocar no valor |
| --- | --- |
| `APP_PASSWORD` | A senha do site gerada na etapa 3. Mínimo: 16 caracteres. |
| `SHEETS_URL` | A URL do Google copiada na etapa 4, terminando em `/exec`. |
| `SHEETS_TOKEN` | A MESMA chave colocada em `CAMADA_TOKEN` no Google. Mínimo: 32 caracteres. |

8. Use o ambiente **Production** e a opção Secret para senha/chave, quando disponível. Para prévias, configure Preview separadamente, preferencialmente com uma planilha de teste.
9. Clique em **Deploy**. Quando aparecer **Ready**, abra o endereço publicado.
10. Na tela do Camada, entre com a senha de `APP_PASSWORD`.

**Se a Vercel já estava configurada:** em **Settings → Environment Variables**, adicione/corrija as três variáveis. Depois vá a **Deployments → … → Redeploy** no último deploy de produção. Só salvar as variáveis não atualiza o deploy existente.

## 7. Testar a primeira gravação

1. No site, clique em **Nova venda**.
2. Produto: **Estrela sensorial**. Quantidade: **300**. Preço por peça: **6**. O total deve ser **R$ 1.800,00**.
3. Informe o custo real estimado por peça, o valor já recebido e as datas. O custo é necessário para estimar o lucro.
4. Clique em **Salvar registro** e espere **Salvo no Google Sheets**.
5. Na sua planilha, abra **Vendas**: deve existir uma nova linha com quantidade 300 e preço unitário 6.
6. Recarregue o site. O registro deve continuar lá.
7. Abra o mesmo endereço em outro dispositivo e entre com a mesma senha. Os dados devem aparecer sem importar arquivos.

Se o teste for fictício, use nome com TESTE e recebido zero; depois cancele o registro. Para um registro real, informe os valores verdadeiros.

## Uso diário

- Registre e edite pelo site. Vendas/encomendas vão para **Vendas**, preços salvos para **Produtos**, investimentos/despesas para **Financeiro**.
- Mudanças de status da fila também são gravadas.
- O site lê a planilha ao abrir e depois de salvar. Clique em **Atualizar** para buscar alterações de outra pessoa; não há atualização contínua.
- Não renomeie abas/cabeçalhos ou modifique IDs diretamente na planilha.
- Se houver edição simultânea do mesmo registro, atualize e refaça a alteração. Isso evita substituir o trabalho de outra pessoa.
- A sessão dura até oito horas. Use **Sair** ao terminar em um dispositivo compartilhado.
- CSV e backup são cópias opcionais, não o meio de salvar os cadastros.

## Resolver problemas

| Situação | Solução |
| --- | --- |
| Falta configurar a conexão | Confira os nomes das três variáveis, tamanho da senha/chave e faça Redeploy. |
| Senha incorreta | Use APP_PASSWORD, não SHEETS_TOKEN. |
| Chave de conexão inválida | CAMADA_TOKEN no Google e SHEETS_TOKEN na Vercel precisam ser idênticos, sem espaços extras. |
| Google não retornou dados | Confira a URL /exec e a implantação como Eu / Qualquer pessoa. |
| Execute prepararPlanilha primeiro | Execute essa função no Apps Script aberto a partir da planilha correta. |
| Gravação não confirmada | Atualize e procure o registro antes de repetir: a linha pode ter sido gravada antes da falha de rede. |
| Registro mudou em outro dispositivo | Clique em Atualizar e refaça a alteração sobre o registro atual. |
| Aparece login da Vercel | Abra o domínio de produção do projeto. O login do Camada usa APP_PASSWORD. |
| Alterei o Apps Script, mas nada mudou | Implantar → Gerenciar implantações → lápis → Nova versão → Implantar. Salvar o editor não publica a mudança. |

## Limites e verificação

Esta versão implementa conexão ao Sheets, validação no servidor, sessão em cookie HttpOnly, gravação de um registro por vez, proteção contra conflitos e repetição da mesma operação sem duplicar a linha. Não salva cadastros novos em localStorage. Os dados da versão anterior não são enviados automaticamente; mantenha o backup antigo se houver registros reais.

Os testes locais cobrem precificação, login, leitura, gravação, alteração, exclusão e conflitos com uma planilha simulada. A confirmação na sua conta Google/Vercel depende de completar o guia. Nenhuma conta ou planilha foi configurada em seu nome nesta entrega.

O financeiro permanece gerencial: faturamento inclui encomendas abertas; lucro = vendas − custos estimados − despesas; caixa = recebido − investimentos pagos − despesas, partindo de zero. Investimento a recuperar = máximo entre zero e investimento − (recebido − custos estimados − despesas). Não há estoque ou conciliação de compras/consumo; não lance o mesmo custo da peça também como despesa sem ajustar o critério.

## Para desenvolvimento, opcional

Node 22 ou superior. Copie os nomes de `.env.example` para `.env.local` e preencha os valores. Execute `npm run dev` e abra http://127.0.0.1:4173. Para testes: `npm test`. Para build: `npm run build`. Nunca envie `.env.local` ao GitHub.

## Documentação oficial consultada

- [Google: publicar apps da Web](https://developers.google.com/apps-script/guides/web)
- [Google: controle de gravações simultâneas](https://developers.google.com/apps-script/reference/lock/)
- [Vercel: funções Node.js](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel: variáveis de ambiente](https://vercel.com/docs/environment-variables)
