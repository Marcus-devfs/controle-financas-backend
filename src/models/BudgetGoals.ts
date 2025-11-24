import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetGoals extends Document {
  userId: mongoose.Types.ObjectId;
  goals: {
    summary: string;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    categoryGoals: {
      categoryId: string;
      categoryName: string;
      categoryType: 'income' | 'expense' | 'investment';
      currentAverage: number;
      recommendedGoal: number;
      percentageOfIncome: number;
      idealPercentage: number;
      difference: number;
      priority: 'low' | 'medium' | 'high';
      reasoning: string;
      paymentMethod?: 'card' | 'cash' | 'both';
    }[];
    overallRecommendations: string[];
    idealBudgetBreakdown: {
      needs: number;
      wants: number;
      savings: number;
    };
    generatedAt: string;
    userPreferences?: {
      targetSavings?: number;
      fixedCategories?: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const BudgetGoalsSchema = new Schema<IBudgetGoals>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Um usuário tem apenas um conjunto de metas
  },
  goals: {
    summary: {
      type: String,
      required: true
    },
    averageMonthlyIncome: {
      type: Number,
      required: true
    },
    averageMonthlyExpenses: {
      type: Number,
      required: true
    },
    categoryGoals: [{
      categoryId: {
        type: String,
        required: true
      },
      categoryName: {
        type: String,
        required: true
      },
      categoryType: {
        type: String,
        required: true,
        enum: ['income', 'expense', 'investment']
      },
      currentAverage: {
        type: Number,
        required: true
      },
      recommendedGoal: {
        type: Number,
        required: true
      },
      percentageOfIncome: {
        type: Number,
        required: true
      },
      idealPercentage: {
        type: Number,
        required: true
      },
      difference: {
        type: Number,
        required: true
      },
      priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
      },
      reasoning: {
        type: String,
        required: true
      },
      paymentMethod: {
        type: String,
        enum: ['card', 'cash', 'both']
      }
    }],
    overallRecommendations: [{
      type: String,
      required: true
    }],
    idealBudgetBreakdown: {
      needs: {
        type: Number,
        required: true
      },
      wants: {
        type: Number,
        required: true
      },
      savings: {
        type: Number,
        required: true
      }
    },
    generatedAt: {
      type: String,
      required: true
    },
    userPreferences: {
      targetSavings: Number,
      fixedCategories: [String]
    }
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

// Middleware para atualizar updatedAt
BudgetGoalsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const BudgetGoals = mongoose.model<IBudgetGoals>('BudgetGoals', BudgetGoalsSchema);

