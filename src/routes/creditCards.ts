import { Router, Response } from 'express';
import CreditCard from '../models/CreditCard';
import { authenticateToken } from '../middleware/auth';
import { validateCreditCard } from '../middleware/validation';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar todos os cartões do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { active } = req.query;
    
    const query: any = { userId: req.user!.id };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const creditCards = await CreditCard.find(query).sort({ name: 1 });

    const response: ApiResponse = {
      success: true,
      message: 'Cartões encontrados',
      data: creditCards
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar cartões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar cartão por ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const creditCard = await CreditCard.findOne({ 
      _id: id, 
      userId: req.user!.id 
    });

    if (!creditCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cartão encontrado',
      data: creditCard
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar novo cartão
router.post('/', validateCreditCard, async (req: AuthRequest, res: Response) => {
  try {
    const creditCardData = req.body;

    const creditCard = new CreditCard({
      ...creditCardData,
      userId: req.user!.id
    });

    await creditCard.save();

    const response: ApiResponse = {
      success: true,
      message: 'Cartão criado com sucesso',
      data: creditCard
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar cartão
router.put('/:id', validateCreditCard, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const creditCard = await CreditCard.findOneAndUpdate(
      { _id: id, userId: req.user!.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!creditCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cartão atualizado com sucesso',
      data: creditCard
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar cartão
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const creditCard = await CreditCard.findOneAndDelete({ 
      _id: id, 
      userId: req.user!.id 
    });

    if (!creditCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cartão deletado com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Ativar/Desativar cartão
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const creditCard = await CreditCard.findOne({ 
      _id: id, 
      userId: req.user!.id 
    });

    if (!creditCard) {
      return res.status(404).json({
        success: false,
        message: 'Cartão não encontrado'
      });
    }

    creditCard.isActive = !creditCard.isActive;
    await creditCard.save();

    const response: ApiResponse = {
      success: true,
      message: `Cartão ${creditCard.isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: creditCard
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao alterar status do cartão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
