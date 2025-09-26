import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../types';

const categorySchema = new Schema<ICategory>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Nome da categoria é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [30, 'Nome deve ter no máximo 30 caracteres']
  },
  type: {
    type: String,
    required: [true, 'Tipo da categoria é obrigatório'],
    enum: {
      values: ['income', 'expense', 'investment'],
      message: 'Tipo deve ser: income, expense ou investment'
    }
  },
  color: {
    type: String,
    required: [true, 'Cor é obrigatória'],
    match: [
      /^#[0-9A-F]{6}$/i,
      'Cor deve estar no formato hexadecimal (#RRGGBB)'
    ]
  }
}, {
  timestamps: true
});

// Índices
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', categorySchema);
