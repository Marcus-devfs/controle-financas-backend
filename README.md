# 🏦 API do Controle Financeiro

API backend para o sistema de controle financeiro pessoal, desenvolvida com Node.js, TypeScript e MongoDB.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem de programação
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB (versão 4.4 ou superior)
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd controle-financas-backend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   MONGODB_URI=mongodb://localhost:27017/controle-financas
   PORT=3001
   JWT_SECRET=seu-jwt-secret-super-seguro
   FRONTEND_URL=http://localhost:3000
   ```

4. **Inicie o MongoDB**
   ```bash
   # Se usando MongoDB local
   mongod
   
   # Ou use MongoDB Atlas (nuvem)
   ```

## 🏃‍♂️ Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📚 Endpoints da API

### 🔐 Autenticação (`/api/auth`)

- `POST /register` - Registrar usuário
- `POST /login` - Fazer login
- `GET /verify` - Verificar token

### 📂 Categorias (`/api/categories`)

- `GET /` - Listar categorias
- `GET /type/:type` - Listar por tipo (income/expense/investment)
- `POST /` - Criar categoria
- `PUT /:id` - Atualizar categoria
- `DELETE /:id` - Deletar categoria

### 💰 Transações (`/api/transactions`)

- `GET /` - Listar transações
- `GET /month/:month` - Listar por mês (YYYY-MM)
- `GET /stats/:month` - Estatísticas do mês
- `POST /` - Criar transação
- `PUT /:id` - Atualizar transação
- `DELETE /:id` - Deletar transação

### 💳 Cartões de Crédito (`/api/credit-cards`)

- `GET /` - Listar cartões
- `GET /:id` - Buscar cartão por ID
- `POST /` - Criar cartão
- `PUT /:id` - Atualizar cartão
- `DELETE /:id` - Deletar cartão
- `PATCH /:id/toggle` - Ativar/Desativar cartão

## 🔒 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

## 📊 Estrutura dos Dados

### Usuário
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

### Categoria
```json
{
  "name": "Alimentação",
  "type": "expense",
  "color": "#FF5733"
}
```

### Transação
```json
{
  "description": "Supermercado",
  "amount": 150.50,
  "date": "2024-01-15",
  "type": "expense",
  "categoryId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "isFixed": false,
  "isRecurring": false
}
```

### Cartão de Crédito
```json
{
  "name": "Cartão Principal",
  "lastFourDigits": "1234",
  "brand": "visa",
  "limit": 5000,
  "closingDay": 5,
  "dueDay": 10,
  "color": "#3B82F6",
  "isActive": true
}
```

## 🧪 Testes

```bash
npm test
```

## 📝 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Executa versão compilada
- `npm test` - Executa testes

## 🔧 Configuração do MongoDB

### Local
```bash
# Instalar MongoDB
brew install mongodb-community

# Iniciar serviço
brew services start mongodb-community
```

### MongoDB Atlas (Nuvem)
1. Crie uma conta em [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster
3. Configure as credenciais
4. Use a string de conexão no `.env`

## 🚨 Segurança

- Senhas são hasheadas com bcrypt
- JWT tokens com expiração
- Rate limiting para prevenir ataques
- Validação de dados de entrada
- CORS configurado
- Helmet para headers de segurança

## 📈 Monitoramento

- Logs com Morgan
- Health check endpoint (`/health`)
- Tratamento de erros centralizado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.
