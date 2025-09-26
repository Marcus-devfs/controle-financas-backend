# 📚 Documentação da API

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:

```
Authorization: Bearer <seu-token>
```

## 📋 Endpoints

### 🔑 Autenticação (`/api/auth`)

#### Registrar Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "senha123"
}
```

#### Verificar Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

---

### 📂 Categorias (`/api/categories`)

#### Listar Categorias
```http
GET /api/categories
Authorization: Bearer <token>
```

#### Listar por Tipo
```http
GET /api/categories/type/expense
Authorization: Bearer <token>
```

#### Criar Categoria
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Alimentação",
  "type": "expense",
  "color": "#FF5733"
}
```

#### Atualizar Categoria
```http
PUT /api/categories/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Supermercado",
  "type": "expense",
  "color": "#FF5733"
}
```

#### Deletar Categoria
```http
DELETE /api/categories/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <token>
```

---

### 💰 Transações (`/api/transactions`)

#### Listar Transações
```http
GET /api/transactions?month=2024-01&type=expense&page=1&limit=10
Authorization: Bearer <token>
```

#### Listar por Mês
```http
GET /api/transactions/month/2024-01
Authorization: Bearer <token>
```

#### Criar Transação
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

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

#### Transação com Parcelamento
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Notebook",
  "amount": 2000.00,
  "date": "2024-01-15",
  "type": "expense",
  "categoryId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "creditCardId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "installmentInfo": {
    "totalInstallments": 12,
    "currentInstallment": 1,
    "installmentAmount": 166.67
  }
}
```

#### Transação Recorrente
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Aluguel",
  "amount": 1200.00,
  "date": "2024-01-05",
  "type": "expense",
  "categoryId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "isRecurring": true,
  "recurringRule": {
    "type": "monthly",
    "interval": 1,
    "dayOfMonth": 5
  }
}
```

#### Estatísticas do Mês
```http
GET /api/transactions/stats/2024-01
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "message": "Estatísticas calculadas",
  "data": {
    "totalIncome": 5000.00,
    "totalExpenses": 3500.00,
    "totalInvestments": 1000.00,
    "balance": 1500.00,
    "fixedIncome": 4000.00,
    "variableIncome": 1000.00,
    "fixedExpenses": 2000.00,
    "variableExpenses": 1500.00,
    "creditCardDebt": 500.00,
    "availableCredit": 4500.00
  }
}
```

---

### 💳 Cartões de Crédito (`/api/credit-cards`)

#### Listar Cartões
```http
GET /api/credit-cards?active=true
Authorization: Bearer <token>
```

#### Criar Cartão
```http
POST /api/credit-cards
Authorization: Bearer <token>
Content-Type: application/json

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

#### Ativar/Desativar Cartão
```http
PATCH /api/credit-cards/64f1a2b3c4d5e6f7g8h9i0j1/toggle
Authorization: Bearer <token>
```

---

## 📊 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Token inválido
- `404` - Recurso não encontrado
- `429` - Muitas tentativas (Rate Limit)
- `500` - Erro interno do servidor

## 🔒 Validações

### Usuário
- Nome: 2-50 caracteres
- Email: formato válido
- Senha: mínimo 6 caracteres

### Categoria
- Nome: 2-30 caracteres
- Tipo: income, expense, investment
- Cor: formato hexadecimal (#RRGGBB)

### Transação
- Descrição: 2-100 caracteres
- Valor: maior que 0
- Data: formato YYYY-MM-DD
- Tipo: income, expense, investment

### Cartão de Crédito
- Nome: 2-30 caracteres
- Últimos 4 dígitos: exatamente 4 números
- Bandeira: visa, mastercard, amex, elo, other
- Limite: maior ou igual a 0
- Dias: 1-31

## 🚨 Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": [
    {
      "field": "campo",
      "message": "mensagem de erro"
    }
  ]
}
```

## 🔄 Rate Limiting

- **Limite**: 100 requests por 15 minutos por IP
- **Header de resposta**: `X-RateLimit-*`
- **Status**: 429 quando excedido

## 🧪 Testando a API

### Com cURL

```bash
# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@email.com","password":"senha123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"senha123"}'

# Listar categorias (substitua <token> pelo token recebido)
curl -X GET http://localhost:3001/api/categories \
  -H "Authorization: Bearer <token>"
```

### Com Postman

1. Importe a collection da API
2. Configure as variáveis de ambiente
3. Execute os requests na ordem

## 📈 Monitoramento

### Health Check
```http
GET /health
```

**Resposta:**
```json
{
  "success": true,
  "message": "API funcionando",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```
