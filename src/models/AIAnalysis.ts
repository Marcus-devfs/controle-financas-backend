import mongoose, { Document, Schema } from 'mongoose';

export interface IAIAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  month: string; // Formato: YYYY-MM
  analysis: {
    summary: string;
    insights: string[];
    suggestions: {
      type: string;
      title: string;
      description: string;
      impact: string;
      category?: string;
      estimatedSavings?: number;
      priority: number;
      timeline?: string;
    }[];
    budgetAnalysis?: {
      currentNeeds: string;
      currentWants: string;
      idealNeeds: number;
      idealWants: number;
      idealSavings: number;
    };
    riskLevel: 'low' | 'medium' | 'high';
    score: number;
    recommendations?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // Formato YYYY-MM
  },
  analysis: {
    summary: {
      type: String,
      required: true
    },
    insights: [{
      type: String,
      required: true
    }],
    suggestions: [{
      type: {
        type: String,
        required: true,
        enum: ['expense_reduction', 'income_increase', 'investment_optimization', 'budget_adjustment', 'financial_planning', 'budget_management']
      },
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      impact: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
      },
      category: String,
      estimatedSavings: Number,
      priority: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      timeline: String
    }],
    budgetAnalysis: {
      currentNeeds: String,
      currentWants: String,
      idealNeeds: Number,
      idealWants: Number,
      idealSavings: Number
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high']
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    recommendations: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice único para userId + month
AIAnalysisSchema.index({ userId: 1, month: 1 }, { unique: true });

// Middleware para atualizar updatedAt
AIAnalysisSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const AIAnalysis = mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
