import { Request } from 'express';
import { Document } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Category Types
export interface ICategory extends Document {
  _id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense' | 'investment';
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Card Types
export interface ICreditCard extends Document {
  _id: string;
  userId: string;
  name: string;
  lastFourDigits: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'other';
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types
export interface IRecurringRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  endDate?: string;
  maxOccurrences?: number;
}

export interface IInstallmentInfo {
  totalInstallments: number;
  currentInstallment: number;
  installmentAmount: number;
}

export interface ITransaction extends Document {
  _id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense' | 'investment';
  isPaid: boolean;
  isFixed: boolean;
  isRecurring: boolean;
  recurringRule?: IRecurringRule;
  dayOfMonth?: number;
  creditCardId?: string;
  installmentInfo?: IInstallmentInfo;
  month: string;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Card Bill Types
export interface ICreditCardBill extends Document {
  _id: string;
  userId: string;
  cardId: string;
  month: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  transactions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  balance: number;
  fixedIncome: number;
  variableIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  creditCardDebt: number;
  availableCredit: number;
}

// Monthly Data Types
export interface MonthlyData {
  month: string;
  fixedIncome: ITransaction[];
  variableIncome: ITransaction[];
  fixedExpenses: ITransaction[];
  variableExpenses: ITransaction[];
  investments: ITransaction[];
  categories: ICategory[];
  creditCards: ICreditCard[];
  creditCardBills: ICreditCardBill[];
}
