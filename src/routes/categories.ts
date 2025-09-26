import { Router, Response } from 'express';
import Category from '../models/Category';
import { authenticateToken } from '../middleware/auth';
import { validateCategory } from '../middleware/validation';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Buscar todas as categorias do usuário
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find({ userId: req.user!.id }).sort({ name: 1 });

    const response: ApiResponse = {
      success: true,
      message: 'Categorias encontradas',
      data: categories
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar categorias por tipo
router.get('/type/:type', async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!['income', 'expense', 'investment'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo inválido'
      });
    }

    const categories = await Category.find({ 
      userId: req.user!.id, 
      type 
    }).sort({ name: 1 });

    const response: ApiResponse = {
      success: true,
      message: 'Categorias encontradas',
      data: categories
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar categorias por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Criar nova categoria
router.post('/', validateCategory, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, color } = req.body;

    // Verificar se já existe categoria com o mesmo nome para o usuário
    const existingCategory = await Category.findOne({ 
      userId: req.user!.id, 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }

    const category = new Category({
      userId: req.user!.id,
      name,
      type,
      color
    });

    await category.save();

    const response: ApiResponse = {
      success: true,
      message: 'Categoria criada com sucesso',
      data: category
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar categoria
router.put('/:id', validateCategory, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;

    const category = await Category.findOne({ 
      _id: id, 
      userId: req.user!.id 
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    // Verificar se já existe outra categoria com o mesmo nome
    const existingCategory = await Category.findOne({ 
      userId: req.user!.id, 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com este nome'
      });
    }

    category.name = name;
    category.type = type;
    category.color = color;

    await category.save();

    const response: ApiResponse = {
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: category
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar categoria
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findOneAndDelete({ 
      _id: id, 
      userId: req.user!.id 
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoria não encontrada'
      });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Categoria deletada com sucesso'
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
