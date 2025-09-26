# 🧪 Como Testar a API

## ✅ Status Atual
- ✅ Servidor rodando na porta 3001
- ✅ MongoDB conectado
- ✅ Todas as rotas configuradas

## 🚀 Testes Rápidos

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Registrar Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

### 3. Fazer Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senha123"
  }'
```

### 4. Criar Categoria (substitua <TOKEN> pelo token recebido)
```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "Alimentação",
    "type": "expense",
    "color": "#FF5733"
  }'
```

### 5. Criar Transação
```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "description": "Supermercado",
    "amount": 150.50,
    "date": "2024-01-15",
    "type": "expense",
    "categoryId": "<CATEGORY_ID>"
  }'
```

## 🌐 Teste no Navegador

1. **Health Check**: http://localhost:3001/health
2. **API Info**: http://localhost:3001/

## 📱 Teste com Postman

1. Importe a collection da API
2. Configure as variáveis:
   - `baseURL`: http://localhost:3001
   - `token`: (será preenchido automaticamente)

## 🗄️ Popular Banco com Dados

```bash
npm run seed
```

Isso criará:
- ✅ Usuário: usuario@exemplo.com (senha: senha123)
- ✅ 16 categorias padrão
- ✅ 2 cartões de crédito de exemplo

## 🔍 Verificar Logs

O servidor mostra logs em tempo real:
- ✅ Conexões MongoDB
- ✅ Requests HTTP
- ✅ Erros e warnings

## 🐛 Troubleshooting

### Erro de Conexão MongoDB
```bash
# Verificar se MongoDB está rodando
brew services list | grep mongodb

# Iniciar MongoDB
brew services start mongodb-community
```

### Porta 3001 em uso
```bash
# Verificar processos na porta 3001
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

### Erro de Dependências
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## 📊 Endpoints Disponíveis

- **GET** `/health` - Status da API
- **GET** `/` - Informações da API
- **POST** `/api/auth/register` - Registrar usuário
- **POST** `/api/auth/login` - Fazer login
- **GET** `/api/auth/verify` - Verificar token
- **GET** `/api/categories` - Listar categorias
- **POST** `/api/categories` - Criar categoria
- **GET** `/api/transactions` - Listar transações
- **POST** `/api/transactions` - Criar transação
- **GET** `/api/credit-cards` - Listar cartões
- **POST** `/api/credit-cards` - Criar cartão

## 🎯 Próximos Passos

1. ✅ **API funcionando** - Pronto para integração
2. 🔄 **Integrar com Frontend** - Substituir localStorage
3. 🚀 **Deploy** - Configurar produção
4. 📱 **Mobile App** - Criar app nativo
5. 🔔 **Notificações** - Alertas de vencimento

## 🎉 Sucesso!

A API está **100% funcional** e pronta para ser integrada com o frontend React!
