# Sistema de Validação de Arquivos Web3

Trata-se de uma aplicação descentralizada para registro e validação de arquivos na blockchain. Ela permite gerar o hash de um arquivo localmente no navegador e registrá-lo, junto aos dados fornecidos, na blockchain Polygon (Testnet Amoy). Este registro possibilita que qualquer usuário possa submeter o arquivo para verificar sua autenticidade.

## 📋 Visão Geral do Projeto

O projeto é composto por dois componentes principais:

1. **Smart Contract (Solidity)**: Contrato inteligente que gerencia o registro e validação de arquivos
2. **Frontend (React + Vite)**: Interface web para interagir com o contrato

## 🛠️ Tecnologias Utilizadas

### Smart Contract
- **Solidity** ^0.8.28
- **Hardhat** 3.1.10 - Framework para desenvolvimento de smart contracts
- **Viem** 2.46.3 - Cliente Ethereum
- **Ethers.js** 6.16.0 - Biblioteca para interação com Ethereum

### Frontend
- **React** 19.2.0 - Biblioteca JavaScript para construção de interfaces
- **Vite** 7.3.1 - Ferramenta de build e desenvolvimento
- **Tailwind CSS** 4.2.1 - Framework CSS
- **Ethers.js** 6.16.0 - Integração com blockchain
- **Vitest** 4.0.18 - Framework de testes

---

## 🚀 Guia de Instalação e Configuração

### 📦 Smart Contract

#### 1. Configurar Dependências

```bash
cd smart_contracts
npm install
```

#### 2. Realizar Testes

Para executar todos os testes:

```bash
npm run test
```

#### 3. Configuração Pré-Deploy

Antes de realizar o deploy, você precisa configurar as chaves privadas usando o plugin `hardhat-keystore`.

**Para configurar a chave privada do Polygon Amoy:**

```bash
npx hardhat keystore set POLYGON_AMOY_PRIVATE_KEY
```

O sistema solicitará que você insira sua chave privada. Esta será armazenada de forma segura no keystore.

⚠️ **IMPORTANTE**: Nunca compartilhe suas chaves privadas e nunca as coloque diretamente em arquivos de configuração ou variáveis de ambiente em produção.

#### 4. Deploy Local

Para fazer deploy na rede local simulada:

```bash
npm run deploy:local
```

Este comando irá:
- Compilar o contrato
- Fazer deploy na rede local do Hardhat
- Exibir o endereço do contrato implantado

#### 5. Deploy na Polygon Amoy

Para fazer deploy na rede de testes Polygon Amoy:

```bash
npm run deploy
```

Este comando irá:
- Compilar o contrato
- Conectar-se à rede Polygon Amoy
- Usar a chave privada armazenada no keystore
- Fazer deploy do contrato
- Salvar o endereço do contrato no arquivo de deployment

---

### 🎨 Frontend

#### 1. Configurar Dependências

```bash
cd frontend
npm install
```

#### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `frontend` com as seguintes variáveis (use o modelo [`.env.example`](frontend/.env.example)):

```env
VITE_CONTRACT_ADDRESS=seu_endereco_do_contrato_aqui
VITE_RPC_URL=https://rpc-amoy.polygon.technology/
VITE_SCAN_URL=https://amoy.polygonscan.com/
```

**Onde:**
- `VITE_CONTRACT_ADDRESS`: Endereço do contrato implantado (obtido após o deploy)
- `VITE_RPC_URL`: URL do provedor RPC da rede (Polygon Amoy)
- `VITE_SCAN_URL`: URL do explorador de blocos (para visualizar transações)

#### 3. Realizar Testes

Para executar os testes:

```bash
npm run test:run
```

#### 4. Deploy Local (Desenvolvimento)

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:5173`

O servidor será reinicializado automaticamente quando você fizer mudanças no código (Hot Module Replacement).

#### 5. Build para Produção

Para compilar a aplicação para produção:

```bash
npm run build
```

Os arquivos compilados serão gerados na pasta `dist/`.

---

## 💻 Como Utilizar a Aplicação

### 📋 Requisitos

Para usar a aplicação, você precisa de:

1. **Navegador com suporte a Web3**: Chrome, Firefox, Edge ou Brave
2. **Wallet MetaMask ou compatível**: [Instalar MetaMask](https://metamask.io/)
3. **Adicionar a rede Polygon Amoy no MetaMask**:
    - Nome da Rede: Polygon Amoy Testnet
    - Novo URL do RPC: https://rpc-amoy.polygon.technology/
    - ID da chain: 80002
    - Símbolo da moeda: POL
    - URL do Block Explorer: https://amoy.polygonscan.com
4. **Obter tokens POL para testes**: [Polygon Faucet](https://faucet.polygon.technology/), [Stakepool Faucet](https://faucet.stakepool.dev.br/amoy) ou [Chainlink Faucet](https://faucets.chain.link/)
5. **Arquivo para validar** (qualquer tipo de arquivo)

### 🔌 Conectar a Carteira

1. Clique no botão **"Conectar Carteira"** no topo da aplicação
2. Selecione **MetaMask** na janela que aparecer
3. Aprove a conexão no MetaMask
4. Certifique-se de estar na rede **Polygon Amoy**
5. Seu endereço será exibido no topo da página

### 📝 Registrar um Arquivo

1. Certifique-se de que sua carteira está **conectada**
2. Certifique-se de que é o **administrador do contrato**
3. Na seção **"Registrar Arquivo"** (lado esquerdo):
   - Clique em **"Selecionar Arquivo"** e selecione o arquivo que deseja registrar
   - Insira uma **Descrição** do arquivo (máximo 255 caracteres)
   - Insira o **Nome do Emissor** (máximo 255 caracteres)
   - Clique em **"Registrar Arquivo"**
4. Aprove a transação no MetaMask
5. Aguarde a confirmação da transação
6. Você verá uma mensagem de sucesso com o hash da transação

⚠️ **Nota**: Apenas o administrador do contrato pode registrar arquivos.

### ✅ Validar um Arquivo

1. Na seção **"Validar Arquivo"** (lado direito):
   - Clique em **"Selecionar Arquivo"** e selecione o arquivo que deseja validar
2. O sistema irá:
   - Calcular o hash SHA-256 do arquivo
   - Consultar o contrato para validar o arquivo
3. O resultado será exibido com:
   - ✅ **Arquivo válido** (com informações de registro) ou
   - ❌ **Arquivo não encontrado** (não foi registrado)

### 🚪 Desconectar a Carteira

1. Clique no **ícone de menu** ao lado do endereço da carteira (topo direito)
2. Selecione **"Desconectar"**
3. Sua carteira será desconectada da aplicação

---

## 📁 Estrutura do Projeto

```
validador-arquivos/
├── smart_contracts/
│   ├── contracts/
│   │   └── ValidadorArquivo.sol
│   ├── ignition/
│   │   └── modules/
│   │       └── Deploy.js
│   ├── test/
│   │   └── ValidadorArquivo.js
│   ├── hardhat.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── abi.json
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   └── .env.example
└── README.md
```

---

## 📝 Licença

MIT License. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request para sugerir melhorias.
