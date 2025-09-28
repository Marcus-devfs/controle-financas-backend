import express from 'express';
import { AIAnalysis } from '../models/AIAnalysis';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/ai-analysis/:month - Buscar análise existente para um mês
router.get('/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    const userId = (req as any).user.id;

    // Validar formato do mês
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM' });
    }

    const analysis = await AIAnalysis.findOne({ 
      userId, 
      month 
    }).select('-__v');

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada para este mês' });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Erro ao buscar análise IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/ai-analysis - Criar/atualizar análise
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { month, analysis } = req.body;
    const userId = (req as any).user?.id;

    console.log('🔍 Debug - req.user:', (req as any).user);
    console.log('🔍 Debug - userId:', userId);

    // Validar dados obrigatórios
    if (!month || !analysis) {
      return res.status(400).json({ error: 'Mês e análise são obrigatórios' });
    }

    // Validar userId
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validar formato do mês
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM' });
    }

    // Validar estrutura da análise
    if (!analysis.summary || !analysis.insights || !analysis.suggestions || !analysis.riskLevel || !analysis.score) {
      return res.status(400).json({ error: 'Estrutura da análise inválida' });
    }

    // Buscar análise existente ou criar nova
    const existingAnalysis = await AIAnalysis.findOne({ userId, month });

    let savedAnalysis;
    if (existingAnalysis) {
      // Atualizar análise existente
      existingAnalysis.analysis = analysis;
      existingAnalysis.updatedAt = new Date();
      savedAnalysis = await existingAnalysis.save();
    } else {
      // Criar nova análise
      savedAnalysis = await AIAnalysis.create({
        userId,
        month,
        analysis
      });
    }

    res.status(201).json({
      success: true,
      data: savedAnalysis,
      message: existingAnalysis ? 'Análise atualizada com sucesso' : 'Análise criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar análise IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/ai-analysis/:month - Deletar análise
router.delete('/:month', authenticateToken, async (req, res) => {
  try {
    const { month } = req.params;
    const userId = (req as any).user.id;

    // Validar formato do mês
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM' });
    }

    const deletedAnalysis = await AIAnalysis.findOneAndDelete({ userId, month });

    if (!deletedAnalysis) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }

    res.json({
      success: true,
      message: 'Análise deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar análise IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/ai-analysis - Listar todas as análises do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 10, page = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const analyses = await AIAnalysis.find({ userId })
      .select('-__v')
      .sort({ month: -1 }) // Mais recentes primeiro
      .skip(skip)
      .limit(Number(limit));

    const total = await AIAnalysis.countDocuments({ userId });

    res.json({
      success: true,
      data: analyses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar análises IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
