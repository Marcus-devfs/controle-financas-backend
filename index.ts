import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar conexão com banco
import connectDB from './src/config/database';

// Importar rotas
import authRoutes from './src/routes/auth';
import categoryRoutes from './src/routes/categories';
import transactionRoutes from './src/routes/transactions';
import creditCardRoutes from './src/routes/creditCards';
import aiAnalysisRoutes from './src/routes/aiAnalysis';
import budgetGoalsRoutes from './src/routes/budgetGoals';
import investmentAccountRoutes from './src/routes/investmentAccounts';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao banco de dados
connectDB();

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/budget-goals', budgetGoalsRoutes);
app.use('/api/investment-accounts', investmentAccountRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API do Controle Financeiro',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      transactions: '/api/transactions',
      creditCards: '/api/credit-cards',
      aiAnalysis: '/api/ai-analysis',
      budgetGoals: '/api/budget-goals',
      investmentAccounts: '/api/investment-accounts'
    }
  });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 API RODANDO NA PORTA ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
  });
}

// Para Vercel
export default app;