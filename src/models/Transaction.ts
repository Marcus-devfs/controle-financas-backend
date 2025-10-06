import mongoose, { Schema } from 'mongoose';
import { ITransaction, IRecurringRule, IInstallmentInfo } from '../types';

const recurringRuleSchema = new Schema<IRecurringRule>({
  type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  interval: {
    type: Number,
    required: true,
    min: 1
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  endDate: {
    type: String
  },
  maxOccurrences: {
    type: Number,
    min: 1
  }
}, { _id: false });

const installmentInfoSchema = new Schema<IInstallmentInfo>({
  totalInstallments: {
    type: Number,
    required: true,
    min: 1,
    max: 24
  },
  currentInstallment: {
    type: Number,
    required: true,
    min: 1
  },
  installmentAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  categoryId: {
    type: String,
    required: [true, 'ID da categoria é obrigatório'],
    ref: 'Category'
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    minlength: [2, 'Descrição deve ter pelo menos 2 caracteres'],
    maxlength: [100, 'Descrição deve ter no máximo 100 caracteres']
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
  type: {
    type: String,
    required: [true, 'Tipo da transação é obrigatório'],
    enum: {
      values: ['income', 'expense', 'investment'],
      message: 'Tipo deve ser: income, expense ou investment'
    }
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  isFixed: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringRule: {
    type: recurringRuleSchema,
    required: function() {
      return this.isRecurring;
    }
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  creditCardId: {
    type: String,
    ref: 'CreditCard'
  },
  installmentInfo: {
    type: installmentInfoSchema
  },
  month: {
    type: String,
    required: [true, 'Mês é obrigatório'],
    match: [/^\d{4}-\d{2}$/, 'Mês deve estar no formato YYYY-MM']
  }
}, {
  timestamps: true
});

// Índices
transactionSchema.index({ userId: 1, month: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, creditCardId: 1 });
transactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
