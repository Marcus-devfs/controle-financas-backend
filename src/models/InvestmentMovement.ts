import mongoose, { Schema } from 'mongoose';
import { IInvestmentMovement } from '../types';

const investmentMovementSchema = new Schema<IInvestmentMovement>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  accountId: {
    type: String,
    required: [true, 'ID da conta é obrigatório'],
    ref: 'InvestmentAccount'
  },
  type: {
    type: String,
    required: [true, 'Tipo é obrigatório'],
    enum: {
      values: ['deposit', 'withdrawal', 'snapshot'],
      message: 'Tipo deve ser: deposit, withdrawal ou snapshot'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0.01, 'Valor deve ser maior que 0']
  },
  date: {
    type: String,
    required: [true, 'Data é obrigatória'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [100, 'Descrição deve ter no máximo 100 caracteres'],
    default: ''
  },
  netBalance: {
    type: Number,
    min: [0, 'Saldo líquido deve ser maior ou igual a 0']
  },
  investmentStartDate: {
    type: String,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD']
  }
}, {
  timestamps: true
});

investmentMovementSchema.index({ userId: 1, accountId: 1 });
investmentMovementSchema.index({ accountId: 1, date: -1 });

export default mongoose.model<IInvestmentMovement>('InvestmentMovement', investmentMovementSchema);
