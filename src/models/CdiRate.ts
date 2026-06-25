import mongoose, { Schema } from 'mongoose';
import { ICdiRate } from '../types';

const cdiRateSchema = new Schema<ICdiRate>({
  date: {
    type: String,
    required: [true, 'Data é obrigatória'],
    unique: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD']
  },
  dailyRate: {
    type: Number,
    required: [true, 'Taxa diária é obrigatória'],
    min: [0, 'Taxa diária deve ser maior ou igual a 0']
  }
}, {
  timestamps: true
});

cdiRateSchema.index({ date: -1 });

export default mongoose.model<ICdiRate>('CdiRate', cdiRateSchema);
