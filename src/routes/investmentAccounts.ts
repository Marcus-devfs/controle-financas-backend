import { Router, Response } from 'express';
import InvestmentAccount from '../models/InvestmentAccount';
import InvestmentMovement from '../models/InvestmentMovement';
import { authenticateToken } from '../middleware/auth';
import {
  validateInvestmentAccount,
  validateInvestmentMovement
} from '../middleware/validation';
import { AuthRequest, ApiResponse, PortfolioSummary } from '../types';
import { simulateAccount } from '../services/investmentCalculator';
import {
  ensureCdiRatesForRange,
  getCdiRatesMap,
  getLatestCdiRate,
  syncCdiRates
} from '../services/cdiService';

const router = Router();
const ACCOUNT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

router.use(authenticateToken);

function emptyAccountSummary(account: { _id: { toString(): string }; name: string; institution: string; cdiPercentage: number; color: string }) {
  return {
    accountId: account._id.toString(),
    name: account.name,
    institution: account.institution,
    cdiPercentage: account.cdiPercentage,
    color: account.color,
    currentBalance: 0,
    principal: 0,
    grossYield: 0,
    estimatedIr: 0,
    netBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    todayYield: 0,
    monthYield: 0,
    lots: [] as PortfolioSummary['accounts'][0]['lots']
  };
}

async function buildPortfolio(userId: string): Promise<PortfolioSummary> {
  const accounts = await InvestmentAccount.find({ userId, isActive: true }).sort({ name: 1 });
  const allMovements = await InvestmentMovement.find({ userId }).sort({ date: 1 });
  let latestCdi = await getLatestCdiRate();

  if (accounts.length === 0) {
    return {
      totalBalance: 0,
      totalPrincipal: 0,
      totalGrossYield: 0,
      totalEstimatedIr: 0,
      totalNetBalance: 0,
      todayYield: 0,
      monthYield: 0,
      accounts: [],
      lastCdiUpdate: latestCdi?.date || null,
      currentCdiRate: latestCdi?.dailyRate || null
    };
  }

  if (allMovements.length === 0) {
    const accountSummaries = accounts.map(emptyAccountSummary);
    return {
      totalBalance: 0,
      totalPrincipal: 0,
      totalGrossYield: 0,
      totalEstimatedIr: 0,
      totalNetBalance: 0,
      todayYield: 0,
      monthYield: 0,
      accounts: accountSummaries,
      lastCdiUpdate: latestCdi?.date || null,
      currentCdiRate: latestCdi?.dailyRate || null
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const startDate = allMovements[0].date;

  await ensureCdiRatesForRange(startDate, today);
  const cdiRates = await getCdiRatesMap(startDate, today);
  latestCdi = await getLatestCdiRate();

  const accountSummaries = accounts.map(account => {
    const movements = allMovements
      .filter(m => m.accountId.toString() === account._id.toString())
      .map(m => ({
        type: m.type,
        amount: m.amount,
        date: m.date,
        netBalance: m.netBalance,
        investmentStartDate: m.investmentStartDate
      }));

    const result = simulateAccount(account.cdiPercentage, movements, cdiRates, today);

    return {
      accountId: account._id.toString(),
      name: account.name,
      institution: account.institution,
      cdiPercentage: account.cdiPercentage,
      color: account.color,
      ...result
    };
  });

  return {
    totalBalance: Math.round(accountSummaries.reduce((s, a) => s + a.currentBalance, 0) * 100) / 100,
    totalPrincipal: Math.round(accountSummaries.reduce((s, a) => s + a.principal, 0) * 100) / 100,
    totalGrossYield: Math.round(accountSummaries.reduce((s, a) => s + a.grossYield, 0) * 100) / 100,
    totalEstimatedIr: Math.round(accountSummaries.reduce((s, a) => s + a.estimatedIr, 0) * 100) / 100,
    totalNetBalance: Math.round(accountSummaries.reduce((s, a) => s + a.netBalance, 0) * 100) / 100,
    todayYield: Math.round(accountSummaries.reduce((s, a) => s + a.todayYield, 0) * 100) / 100,
    monthYield: Math.round(accountSummaries.reduce((s, a) => s + a.monthYield, 0) * 100) / 100,
    accounts: accountSummaries,
    lastCdiUpdate: latestCdi?.date || null,
    currentCdiRate: latestCdi?.dailyRate || null
  };
}

router.get('/portfolio', async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await buildPortfolio(req.user!.id);
    const response: ApiResponse<PortfolioSummary> = {
      success: true,
      message: 'Carteira calculada',
      data: portfolio
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao calcular carteira:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.post('/cdi/sync', async (req: AuthRequest, res: Response) => {
  try {
    const count = await syncCdiRates(
      new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const response: ApiResponse = {
      success: true,
      message: `${count} taxas CDI sincronizadas`,
      data: { count }
    };
    res.json(response);
  } catch (error: any) {
    console.error('Erro ao sincronizar CDI:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Erro ao sincronizar CDI do Banco Central'
    });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await InvestmentAccount.find({ userId: req.user!.id }).sort({ name: 1 });
    const response: ApiResponse = {
      success: true,
      message: 'Contas encontradas',
      data: accounts
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.post('/', validateInvestmentAccount, async (req: AuthRequest, res: Response) => {
  try {
    const existingCount = await InvestmentAccount.countDocuments({ userId: req.user!.id });
    const color = req.body.color || ACCOUNT_COLORS[existingCount % ACCOUNT_COLORS.length];

    const account = new InvestmentAccount({
      ...req.body,
      color,
      userId: req.user!.id
    });
    await account.save();

    const response: ApiResponse = {
      success: true,
      message: 'Conta criada com sucesso',
      data: account
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.put('/:id', validateInvestmentAccount, async (req: AuthRequest, res: Response) => {
  try {
    const account = await InvestmentAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Conta atualizada com sucesso',
      data: account
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const account = await InvestmentAccount.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }

    await InvestmentMovement.deleteMany({ accountId: req.params.id, userId: req.user!.id });

    const response: ApiResponse = {
      success: true,
      message: 'Conta excluída com sucesso'
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.get('/:id/movements', async (req: AuthRequest, res: Response) => {
  try {
    const account = await InvestmentAccount.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }

    const movements = await InvestmentMovement.find({
      accountId: req.params.id,
      userId: req.user!.id
    }).sort({ date: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Movimentações encontradas',
      data: movements
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.post('/:id/movements', validateInvestmentMovement, async (req: AuthRequest, res: Response) => {
  try {
    const account = await InvestmentAccount.findOne({
      _id: req.params.id,
      userId: req.user!.id
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Conta não encontrada' });
    }

    if (req.body.type === 'snapshot') {
      if (req.body.netBalance === undefined || !req.body.investmentStartDate) {
        return res.status(400).json({
          success: false,
          message: 'Importação de saldo requer saldo líquido e data de início do investimento'
        });
      }
      if (req.body.netBalance >= req.body.amount) {
        return res.status(400).json({
          success: false,
          message: 'Saldo líquido deve ser menor que o saldo bruto'
        });
      }
      if (req.body.investmentStartDate > req.body.date) {
        return res.status(400).json({
          success: false,
          message: 'Data de início não pode ser posterior à data do saldo'
        });
      }
    }

    if (req.body.type === 'withdrawal') {
      const existingMovements = await InvestmentMovement.find({
        accountId: req.params.id,
        userId: req.user!.id
      }).sort({ date: 1 });

      const today = new Date().toISOString().split('T')[0];
      const startDate = existingMovements.length > 0 ? existingMovements[0].date : today;
      await ensureCdiRatesForRange(startDate, today);
      const cdiRates = await getCdiRatesMap(startDate, today);

      const movements = existingMovements.map(m => ({
        type: m.type,
        amount: m.amount,
        date: m.date,
        netBalance: m.netBalance,
        investmentStartDate: m.investmentStartDate
      }));

      const current = simulateAccount(account.cdiPercentage, movements, cdiRates, today);

      if (req.body.amount > current.currentBalance + 0.01) {
        return res.status(400).json({
          success: false,
          message: `Saldo insuficiente. Saldo atual: R$ ${current.currentBalance.toFixed(2)}`
        });
      }
    }

    const movement = new InvestmentMovement({
      ...req.body,
      accountId: req.params.id,
      userId: req.user!.id
    });
    await movement.save();

    const response: ApiResponse = {
      success: true,
      message: 'Movimentação registrada com sucesso',
      data: movement
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

router.delete('/movements/:movementId', async (req: AuthRequest, res: Response) => {
  try {
    const movement = await InvestmentMovement.findOneAndDelete({
      _id: req.params.movementId,
      userId: req.user!.id
    });

    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movimentação não encontrada' });
    }

    const response: ApiResponse = {
      success: true,
      message: 'Movimentação excluída com sucesso'
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao excluir movimentação:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

export default router;
