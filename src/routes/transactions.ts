import { Router, Response } from 'express';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import CreditCard from '../models/CreditCard';
import CreditCardBill from '../models/CreditCardBill';
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

    // Buscar transações sem populate primeiro para filtrar dados inválidos
    const transactionsRaw = await Transaction.find({ 
      userId: req.user!.id, 
      month 
    }).lean();

    // Filtrar transações com categoryId válido (string/ObjectId)
    const validTransactions = transactionsRaw.filter(t => {
      const catId: any = t.categoryId;
      // Verificar se é string válida ou ObjectId válido
      if (typeof catId === 'string') {
        return /^[0-9a-fA-F]{24}$/.test(catId);
      }
      if (catId && typeof catId === 'object' && catId !== null && '_id' in catId) {
        return /^[0-9a-fA-F]{24}$/.test(String(catId._id));
      }
      return false;
    });

    // Buscar novamente com populate apenas para transações válidas
    const transactionIds = validTransactions.map(t => t._id);
    
    const transactions = await Transaction.find({ 
      _id: { $in: transactionIds },
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

// Duplicar transações fixas e faturas de cartão de um mês para outro
router.post('/duplicate-month/:sourceMonth/:targetMonth', async (req: AuthRequest, res: Response) => {
  try {
    const { sourceMonth, targetMonth } = req.params;
    
    // Validar formato dos meses
    if (!/^\d{4}-\d{2}$/.test(sourceMonth) || !/^\d{4}-\d{2}$/.test(targetMonth)) {
      return res.status(400).json({
        success: false,
        message: 'Formato do mês inválido. Use YYYY-MM'
      });
    }

    const userId = req.user!.id;
    const sourceDate = new Date(sourceMonth + '-01');
    const targetDate = new Date(targetMonth + '-01');
    const duplicated: string[] = [];

    // 1. Duplicar transações fixas do mês origem
    const fixedTransactions = await Transaction.find({
      userId,
      month: sourceMonth,
      isFixed: true
    }).lean();

    for (const fixed of fixedTransactions) {
      // Verificar se já existe uma transação igual no mês destino
      const existing = await Transaction.findOne({
        userId,
        month: targetMonth,
        description: fixed.description,
        amount: fixed.amount,
        categoryId: fixed.categoryId,
        type: fixed.type,
        isFixed: true
      });

      if (!existing) {
        // Calcular data baseada no dayOfMonth
        let transactionDate = new Date(targetDate);
        if (fixed.dayOfMonth) {
          const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
          const day = Math.min(fixed.dayOfMonth, lastDay);
          transactionDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
        } else {
          // Usar o mesmo dia do mês original
          const originalDate = new Date(fixed.date);
          const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
          const day = Math.min(originalDate.getDate(), lastDay);
          transactionDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
        }

        const newTransaction = new Transaction({
          userId,
          categoryId: fixed.categoryId.toString(),
          description: fixed.description,
          amount: fixed.amount,
          date: transactionDate.toISOString().split('T')[0],
          type: fixed.type,
          isFixed: true,
          isRecurring: fixed.isRecurring || false,
          recurringRule: fixed.recurringRule || undefined,
          dayOfMonth: fixed.dayOfMonth || undefined,
          month: targetMonth,
          isPaid: false // Nova transação sempre começa como não paga
        });

        await newTransaction.save();
        duplicated.push(newTransaction._id.toString());
      }
    }

    // 2. Duplicar faturas de cartão de crédito do mês origem
    const sourceBills = await CreditCardBill.find({
      userId,
      month: sourceMonth
    }).lean();

    for (const sourceBill of sourceBills) {
      // Verificar se já existe fatura para este mês
      const existingBill = await CreditCardBill.findOne({
        userId,
        cardId: sourceBill.cardId.toString(),
        month: targetMonth
      });

      if (!existingBill) {
        // Buscar todas as transações do cartão no mês origem para copiar
        const sourceTransactions = await Transaction.find({
          userId,
          creditCardId: sourceBill.cardId.toString(),
          month: sourceMonth
        }).lean();

        // Calcular data de vencimento baseada no cartão
        const card = await CreditCard.findById(sourceBill.cardId);
        if (card) {
          const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
          const dueDay = Math.min(card.dueDay, lastDay);
          const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), dueDay);

          // Criar fatura vazia para o mês destino (transações serão adicionadas depois)
          const newBill = new CreditCardBill({
            userId,
            cardId: sourceBill.cardId.toString(),
            month: targetMonth,
            totalAmount: 0, // Começa vazio, será atualizado quando houver transações
            paidAmount: 0,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pending',
            transactions: []
          });

          await newBill.save();
          duplicated.push(newBill._id.toString());
        }
      }
    }

    const response: ApiResponse = {
      success: true,
      message: `Transações e faturas duplicadas de ${sourceMonth} para ${targetMonth}`,
      data: {
        sourceMonth,
        targetMonth,
        duplicatedCount: duplicated.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao duplicar mês:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
