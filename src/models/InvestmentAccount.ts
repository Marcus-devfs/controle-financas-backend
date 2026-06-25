import mongoose, { Schema } from 'mongoose';
import { IInvestmentAccount } from '../types';

const investmentAccountSchema = new Schema<IInvestmentAccount>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Nome deve ter no máximo 50 caracteres']
  },
  institution: {
    type: String,
    required: [true, 'Instituição é obrigatória'],
    trim: true,
    maxlength: [50, 'Instituição deve ter no máximo 50 caracteres']
  },
  cdiPercentage: {
    type: Number,
    required: [true, 'Percentual do CDI é obrigatório'],
    min: [0, 'Percentual do CDI deve ser maior ou igual a 0'],
    max: [500, 'Percentual do CDI deve ser no máximo 500']
  },
  color: {
    type: String,
    required: [true, 'Cor é obrigatória'],
    match: [/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

investmentAccountSchema.index({ userId: 1 });
investmentAccountSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IInvestmentAccount>('InvestmentAccount', investmentAccountSchema);
