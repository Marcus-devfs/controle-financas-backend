import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validações para usuário
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  handleValidationErrors
];

// Validações para categoria
export const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Nome deve ter entre 2 e 30 caracteres'),
  body('type')
    .isIn(['income', 'expense', 'investment'])
    .withMessage('Tipo deve ser: income, expense ou investment'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
  handleValidationErrors
];

// Validações para cartão de crédito
export const validateCreditCard = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Nome deve ter entre 2 e 30 caracteres'),
  body('lastFourDigits')
    .matches(/^\d{4}$/)
    .withMessage('Últimos 4 dígitos devem conter exatamente 4 números'),
  body('brand')
    .isIn(['visa', 'mastercard', 'amex', 'elo', 'other'])
    .withMessage('Bandeira deve ser: visa, mastercard, amex, elo ou other'),
  body('limit')
    .isFloat({ min: 0 })
    .withMessage('Limite deve ser um número maior ou igual a 0'),
  body('closingDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Dia do fechamento deve ser entre 1 e 31'),
  body('dueDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Dia do vencimento deve ser entre 1 e 31'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
  handleValidationErrors
];

// Validações para transação
export const validateTransaction = [
  body('description')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Descrição deve ter entre 2 e 100 caracteres'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número maior que 0'),
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Data deve estar no formato YYYY-MM-DD'),
  body('type')
    .isIn(['income', 'expense', 'investment'])
    .withMessage('Tipo deve ser: income, expense ou investment'),
  body('categoryId')
    .notEmpty()
    .withMessage('ID da categoria é obrigatório'),
  handleValidationErrors
];
