import mongoose, { Schema } from 'mongoose';
import { ICreditCardBill } from '../types';

const creditCardBillSchema = new Schema<ICreditCardBill>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  cardId: {
    type: String,
    required: [true, 'ID do cartão é obrigatório'],
    ref: 'CreditCard'
  },
  month: {
    type: String,
    required: [true, 'Mês é obrigatório'],
    match: [/^\d{4}-\d{2}$/, 'Mês deve estar no formato YYYY-MM']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Valor total é obrigatório'],
    min: [0, 'Valor total deve ser maior ou igual a 0']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Valor pago deve ser maior ou igual a 0']
  },
  dueDate: {
    type: String,
    required: [true, 'Data de vencimento é obrigatória'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD']
  },
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: {
      values: ['pending', 'paid', 'overdue'],
      message: 'Status deve ser: pending, paid ou overdue'
    },
    default: 'pending'
  },
  transactions: [{
    type: String,
    ref: 'Transaction'
  }]
}, {
  timestamps: true
});

// Índices
creditCardBillSchema.index({ userId: 1, month: 1 });
creditCardBillSchema.index({ userId: 1, cardId: 1 });
creditCardBillSchema.index({ userId: 1, status: 1 });
creditCardBillSchema.index({ userId: 1, cardId: 1, month: 1 }, { unique: true });

export default mongoose.model<ICreditCardBill>('CreditCardBill', creditCardBillSchema);
