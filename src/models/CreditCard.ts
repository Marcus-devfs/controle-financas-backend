import mongoose, { Schema } from 'mongoose';
import { ICreditCard } from '../types';

const creditCardSchema = new Schema<ICreditCard>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Nome do cartão é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [30, 'Nome deve ter no máximo 30 caracteres']
  },
  lastFourDigits: {
    type: String,
    required: [true, 'Últimos 4 dígitos são obrigatórios'],
    match: [/^\d{4}$/, 'Últimos 4 dígitos devem conter exatamente 4 números']
  },
  brand: {
    type: String,
    required: [true, 'Bandeira é obrigatória'],
    enum: {
      values: ['visa', 'mastercard', 'amex', 'elo', 'other'],
      message: 'Bandeira deve ser: visa, mastercard, amex, elo ou other'
    }
  },
  limit: {
    type: Number,
    required: [true, 'Limite é obrigatório'],
    min: [0, 'Limite deve ser maior ou igual a 0']
  },
  closingDay: {
    type: Number,
    required: [true, 'Dia do fechamento é obrigatório'],
    min: [1, 'Dia do fechamento deve ser entre 1 e 31'],
    max: [31, 'Dia do fechamento deve ser entre 1 e 31']
  },
  dueDay: {
    type: Number,
    required: [true, 'Dia do vencimento é obrigatório'],
    min: [1, 'Dia do vencimento deve ser entre 1 e 31'],
    max: [31, 'Dia do vencimento deve ser entre 1 e 31']
  },
  color: {
    type: String,
    required: [true, 'Cor é obrigatória'],
    match: [
      /^#[0-9A-F]{6}$/i,
      'Cor deve estar no formato hexadecimal (#RRGGBB)'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
creditCardSchema.index({ userId: 1 });
creditCardSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<ICreditCard>('CreditCard', creditCardSchema);
