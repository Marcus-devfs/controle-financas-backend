import express from 'express';
import { BudgetGoals } from '../models/BudgetGoals';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/budget-goals - Buscar metas do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const budgetGoals = await BudgetGoals.findOne({ userId }).select('-__v');

    if (!budgetGoals) {
      return res.status(404).json({ 
        success: false,
        error: 'Metas não encontradas' 
      });
    }

    res.json({
      success: true,
      data: budgetGoals
    });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/budget-goals - Criar/atualizar metas
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { goals } = req.body;
    const userId = (req as any).user?.id;

    // Validar dados obrigatórios
    if (!goals) {
      return res.status(400).json({ 
        success: false,
        error: 'Metas são obrigatórias' 
      });
    }

    // Validar userId
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    // Validar estrutura das metas
    if (!goals.summary || !goals.averageMonthlyIncome || !goals.categoryGoals || !goals.idealBudgetBreakdown) {
      return res.status(400).json({ 
        success: false,
        error: 'Estrutura das metas inválida' 
      });
    }

    // Buscar metas existentes ou criar novas
    const existingGoals = await BudgetGoals.findOne({ userId });

    let savedGoals;
    if (existingGoals) {
      // Atualizar metas existentes
      existingGoals.goals = goals;
      existingGoals.updatedAt = new Date();
      savedGoals = await existingGoals.save();
    } else {
      // Criar novas metas
      savedGoals = await BudgetGoals.create({
        userId,
        goals
      });
    }

    res.status(201).json({
      success: true,
      data: savedGoals,
      message: existingGoals ? 'Metas atualizadas com sucesso' : 'Metas criadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar metas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// DELETE /api/budget-goals - Deletar metas
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const deletedGoals = await BudgetGoals.findOneAndDelete({ userId });

    if (!deletedGoals) {
      return res.status(404).json({ 
        success: false,
        error: 'Metas não encontradas' 
      });
    }

    res.json({
      success: true,
      message: 'Metas deletadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar metas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;

