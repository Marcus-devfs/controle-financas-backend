import { InvestmentLotSummary } from '../types';

interface Lot {
  principal: number;
  grossYield: number;
  depositDate: string;
}

interface Movement {
  type: 'deposit' | 'withdrawal' | 'snapshot';
  amount: number;
  date: string;
  netBalance?: number;
  investmentStartDate?: string;
}

export function deriveSnapshotLot(
  grossBalance: number,
  netBalance: number,
  investmentStartDate: string,
  referenceDate: string
): { principal: number; grossYield: number; depositDate: string } {
  const daysHeld = daysBetween(investmentStartDate, referenceDate);
  const irRate = getIrRate(daysHeld);
  const impliedIr = Math.max(0, grossBalance - netBalance);
  const grossYield = irRate > 0 ? impliedIr / irRate : 0;
  const principal = Math.max(0, grossBalance - grossYield);

  return {
    principal: Math.round(principal * 100) / 100,
    grossYield: Math.round(grossYield * 100) / 100,
    depositDate: investmentStartDate
  };
}

export function getIrRate(daysHeld: number): number {
  if (daysHeld <= 180) return 0.225;
  if (daysHeld <= 360) return 0.20;
  if (daysHeld <= 720) return 0.175;
  return 0.15;
}

export function getIrRateLabel(daysHeld: number): string {
  if (daysHeld <= 180) return '22,5%';
  if (daysHeld <= 360) return '20%';
  if (daysHeld <= 720) return '17,5%';
  return '15%';
}

export function isBusinessDay(dateStr: string): boolean {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  return Math.max(0, Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

function distributeYield(lots: Lot[], totalYield: number, principalBeforeYield: number): void {
  if (principalBeforeYield <= 0 || totalYield <= 0) return;
  for (const lot of lots) {
    const share = lot.principal / principalBeforeYield;
    lot.grossYield += totalYield * share;
  }
}

function withdrawFifo(lots: Lot[], amount: number): void {
  let remaining = amount;
  while (remaining > 0 && lots.length > 0) {
    const lot = lots[0];
    const lotTotal = lot.principal + lot.grossYield;
    if (lotTotal <= remaining + 0.001) {
      remaining -= lotTotal;
      lots.shift();
    } else {
      const principalShare = lot.principal / lotTotal;
      const principalWithdrawn = remaining * principalShare;
      const yieldWithdrawn = remaining - principalWithdrawn;
      lot.principal -= principalWithdrawn;
      lot.grossYield -= yieldWithdrawn;
      remaining = 0;
      if (lot.principal < 0.001 && lot.grossYield < 0.001) {
        lots.shift();
      }
    }
  }
}

export interface AccountSimulationResult {
  currentBalance: number;
  principal: number;
  grossYield: number;
  estimatedIr: number;
  netBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  todayYield: number;
  monthYield: number;
  lots: InvestmentLotSummary[];
}

export function simulateAccount(
  cdiPercentage: number,
  movements: Movement[],
  cdiRates: Map<string, number>,
  endDate: string = formatDate(new Date())
): AccountSimulationResult {
  if (movements.length === 0) {
    return {
      currentBalance: 0,
      principal: 0,
      grossYield: 0,
      estimatedIr: 0,
      netBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      todayYield: 0,
      monthYield: 0,
      lots: []
    };
  }

  const sortedMovements = [...movements].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = sortedMovements[0].date;

  const movementsByDate = new Map<string, Movement[]>();
  for (const mov of sortedMovements) {
    const existing = movementsByDate.get(mov.date) || [];
    existing.push(mov);
    movementsByDate.set(mov.date, existing);
  }

  let balance = 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalGrossYield = 0;
  let todayYield = 0;
  let monthYield = 0;
  const lots: Lot[] = [];
  const currentMonth = getMonthKey(endDate);

  let lastKnownRate = 0.04;
  const sortedRateDates = [...cdiRates.keys()].sort();

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (isBusinessDay(date) && balance > 0) {
      let rate = cdiRates.get(date);
      if (rate === undefined) {
        const prevDates = sortedRateDates.filter(d => d <= date);
        rate = prevDates.length > 0
          ? cdiRates.get(prevDates[prevDates.length - 1])!
          : lastKnownRate;
      } else {
        lastKnownRate = rate;
      }

      const principalBeforeYield = lots.reduce((sum, l) => sum + l.principal, 0);
      const dailyYield = balance * (rate / 100) * (cdiPercentage / 100);
      balance += dailyYield;
      totalGrossYield += dailyYield;
      distributeYield(lots, dailyYield, principalBeforeYield);

      if (date === endDate) {
        todayYield = dailyYield;
      }
      if (getMonthKey(date) === currentMonth) {
        monthYield += dailyYield;
      }
    }

    const dayMovements = movementsByDate.get(date) || [];
    for (const mov of dayMovements) {
      if (mov.type === 'snapshot') {
        const grossBalance = mov.amount;
        const netBalance = mov.netBalance ?? grossBalance;
        const investmentStartDate = mov.investmentStartDate ?? date;
        const lot = deriveSnapshotLot(grossBalance, netBalance, investmentStartDate, date);

        balance += grossBalance;
        lots.push({
          principal: lot.principal,
          grossYield: lot.grossYield,
          depositDate: lot.depositDate
        });
        totalDeposits += lot.principal;
      } else if (mov.type === 'deposit') {
        balance += mov.amount;
        lots.push({ principal: mov.amount, grossYield: 0, depositDate: date });
        totalDeposits += mov.amount;
      } else {
        withdrawFifo(lots, mov.amount);
        balance -= mov.amount;
        totalWithdrawals += mov.amount;
      }
    }
  }

  const principal = lots.reduce((sum, l) => sum + l.principal, 0);
  const grossYield = lots.reduce((sum, l) => sum + l.grossYield, 0);

  const lotSummaries: InvestmentLotSummary[] = lots.map(lot => {
    const daysHeld = daysBetween(lot.depositDate, endDate);
    const irRate = getIrRate(daysHeld);
    return {
      depositDate: lot.depositDate,
      principal: Math.round(lot.principal * 100) / 100,
      grossYield: Math.round(lot.grossYield * 100) / 100,
      daysHeld,
      irRate,
      estimatedIr: Math.round(lot.grossYield * irRate * 100) / 100
    };
  });

  const estimatedIr = lotSummaries.reduce((sum, l) => sum + l.estimatedIr, 0);

  return {
    currentBalance: Math.round(balance * 100) / 100,
    principal: Math.round(principal * 100) / 100,
    grossYield: Math.round(grossYield * 100) / 100,
    estimatedIr: Math.round(estimatedIr * 100) / 100,
    netBalance: Math.round((balance - estimatedIr) * 100) / 100,
    totalDeposits: Math.round(totalDeposits * 100) / 100,
    totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
    todayYield: Math.round(todayYield * 100) / 100,
    monthYield: Math.round(monthYield * 100) / 100,
    lots: lotSummaries
  };
}
