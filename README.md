# Nitro React v4

## Pré-requisitos

- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/) >= 18

- Se estiver usando NodeJS < 18, remova `--openssl-legacy-provider` dos scripts do package.json
- [Yarn](https://yarnpkg.com/) `npm i yarn -g`

## Instalação

- Primeiro, abra o terminal e navegue até a pasta onde deseja clonar o Nitro
- Clone o Nitro

- `git clone https://git.krews.org/nitro/nitro-react.git`
- Instale as dependências

- `yarn install`

- Isso pode levar algum tempo, tenha paciência
- Renomeie alguns arquivos

- Renomeie `public/renderer-config.json.example` para `public/renderer-config.json`

- Renomeie Substitua `public/ui-config.json.example` por `public/ui-config.json`
- Defina seus links
- Abra `public/renderer-config.json`

- Atualize `socket.url`, `asset.url`, `image.library.url` e `hof.furni.url`

- Abra `public/ui-config.json`

- Atualize `camera.url`, `thumbnails.url`, `url.prefix` e `habbopages.url`

- Você pode sobrescrever qualquer variável passando-a para `NitroConfig` no arquivo index.html

## Uso

- Para usar o Nitro, você precisa gerar arquivos `.nitro`. Consulte o [nitro-converter](https://git.krews.org/nitro/nitro-converter) para obter instruções.
- Consulte o [Morningstar Websockets](https://git.krews.org/nitro/ms-websockets) para obter instruções de configuração. WebSockets no seu servidor

### Desenvolvimento

Execute o Nitro em modo de desenvolvimento ao editar os arquivos. Dessa forma, você poderá ver as alterações instantaneamente no seu navegador.

```
yarn start
```

### Produção

Para criar uma versão de produção do Nitro, basta executar o seguinte comando:

```
yarn build:prod
```

- Uma pasta `dist` será gerada. Esses são os arquivos que devem ser enviados para o seu servidor web.
- Consulte a documentação do seu CMS para verificar a compatibilidade com o Nitro e como adicionar os arquivos de produção.
