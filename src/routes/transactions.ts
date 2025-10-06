import { Router, Response } from 'express';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import { authenticateToken } from '../middleware/auth';
import { validateTransaction, validateTransactionUpdate } from '../middleware/validation';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar transações do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { month, type, categoryId, page = 1, limit = 50 } = req.query;
    
    const query: any = { userId: req.user!.id };
    
    if (month) query.month = month;
    if (type) query.type = type;
    if (categoryId) query.categoryId = categoryId;

    const skip = (Number(page) - 1) * Number(limit);
    
    const transactions = await Transaction.find(query)
      .populate('categoryId', 'name type color')
      .populate('creditCardId', 'name lastFourDigits brand')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    const response: ApiResponse = {
      success: true,
      message: 'Transações encontradas',
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar transações por mês
router.get('/month/:month', async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.params;
    
    // Validar formato do mês (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Formato do mês inválido. Use YYYY-MM'
      });
    }

    const transactions = await Transaction.find({ 
      userId: req.user!.id, 
      month 
    })
      .populate('categoryId', 'name type color')
      .populate('creditCardId', 'name lastFourDigits brand')
      .sort({ date: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Transações do mês encontradas',
      data: transactions
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar transações do mês:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar nova transação
router.post('/', validateTransaction, async (req: AuthRequest, res: Response) => {
  try {
    const transactionData = req.body;
    
    // Verificar se a categoria existe e pertence ao usuário
    const category = await Category.findOne({ 
      _id: transactionData.categoryId, 
      userId: req.user!.id 
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Extrair mês da data
    const month = transactionData.date.substring(0, 7); // YYYY-MM

    const transaction = new Transaction({
      ...transactionData,
      userId: req.user!.id,
      month
    });

    await transaction.save();

    // Popular dados relacionados
    await transaction.populate([
      { path: 'categoryId', select: 'name type color' },
      { path: 'creditCardId', select: 'name lastFourDigits brand' }
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Transação criada com sucesso',
      data: transaction
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar transação
router.put('/:id', validateTransactionUpdate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar se a categoria existe e pertence ao usuário
    if (updateData.categoryId) {
      const category = await Category.findOne({ 
        _id: updateData.categoryId, 
        userId: req.user!.id 
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }
    }

    // Atualizar mês se a data foi alterada
    if (updateData.date) {
      updateData.month = updateData.date.substring(0, 7);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user!.id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name type color')
      .populate('creditCardId', 'name lastFourDigits brand');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Transação atualizada com sucesso',
      data: transaction
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar transação
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({ 
      _id: id, 
      userId: req.user!.id 
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Transação deletada com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar estatísticas do dashboard
router.get('/stats/:month', async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.params;
    
    // Validar formato do mês
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Formato do mês inválido. Use YYYY-MM'
      });
    }

    const transactions = await Transaction.find({ 
      userId: req.user!.id, 
      month 
    });

    // Calcular estatísticas
    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      totalInvestments: 0,
      balance: 0,
      fixedIncome: 0,
      variableIncome: 0,
      fixedExpenses: 0,
      variableExpenses: 0,
      creditCardDebt: 0,
      availableCredit: 0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        stats.totalIncome += transaction.amount;
        if (transaction.isFixed) {
          stats.fixedIncome += transaction.amount;
        } else {
          stats.variableIncome += transaction.amount;
        }
      } else if (transaction.type === 'expense') {
        stats.totalExpenses += transaction.amount;
        if (transaction.isFixed) {
          stats.fixedExpenses += transaction.amount;
        } else {
          stats.variableExpenses += transaction.amount;
        }
      } else if (transaction.type === 'investment') {
        stats.totalInvestments += transaction.amount;
      }
    });

    stats.balance = stats.totalIncome - stats.totalExpenses;

    const response: ApiResponse = {
      success: true,
      message: 'Estatísticas calculadas',
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
