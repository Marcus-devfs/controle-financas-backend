import CdiRate from '../models/CdiRate';

function bcbDateToIso(bcbDate: string): string {
  const [day, month, year] = bcbDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function isoToBcbDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function isoToday(): string {
  return new Date().toISOString().split('T')[0];
}

function minIsoDate(a: string, b: string): string {
  return a <= b ? a : b;
}

async function fetchLatestBcbEntry(): Promise<{ date: string; dailyRate: number }> {
  const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Erro ao buscar último CDI do BCB (${response.status})`);
  }

  const data = await response.json() as { data: string; valor: string }[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('BCB não retornou taxa CDI recente');
  }

  return {
    date: bcbDateToIso(data[0].data),
    dailyRate: parseFloat(data[0].valor)
  };
}

export async function fetchCdiRatesFromBcb(startDate: string, endDate: string): Promise<{ date: string; dailyRate: number }[]> {
  const latest = await fetchLatestBcbEntry();
  const safeEndDate = minIsoDate(endDate, latest.date);

  if (startDate > safeEndDate) {
    return [];
  }

  const dataInicial = encodeURIComponent(isoToBcbDate(startDate));
  const dataFinal = encodeURIComponent(isoToBcbDate(safeEndDate));
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Erro ao buscar CDI do BCB (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json() as { data: string; valor: string }[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Nenhuma taxa CDI retornada pelo Banco Central para o período solicitado');
  }

  return data.map(item => ({
    date: bcbDateToIso(item.data),
    dailyRate: parseFloat(item.valor)
  }));
}

async function fetchRecentCdiRatesFromBcb(count = 500): Promise<{ date: string; dailyRate: number }[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/${count}?formato=json`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Erro ao buscar CDI recente do BCB (${response.status})`);
  }

  const data = await response.json() as { data: string; valor: string }[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('BCB não retornou taxas CDI recentes');
  }

  return data.map(item => ({
    date: bcbDateToIso(item.data),
    dailyRate: parseFloat(item.valor)
  }));
}

async function saveRates(rates: { date: string; dailyRate: number }[]): Promise<number> {
  if (rates.length === 0) return 0;

  const ops = rates.map(rate => ({
    updateOne: {
      filter: { date: rate.date },
      update: { $set: { dailyRate: rate.dailyRate } },
      upsert: true
    }
  }));

  const chunkSize = 500;
  for (let i = 0; i < ops.length; i += chunkSize) {
    await CdiRate.bulkWrite(ops.slice(i, i + chunkSize), { ordered: false });
  }

  return rates.length;
}

export async function syncCdiRates(startDate: string, endDate: string): Promise<number> {
  const rates = await fetchCdiRatesFromBcb(startDate, endDate);
  return saveRates(rates);
}

export async function getCdiRatesMap(startDate: string, endDate: string): Promise<Map<string, number>> {
  const rates = await CdiRate.find({
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  const map = new Map<string, number>();
  for (const rate of rates) {
    map.set(rate.date, rate.dailyRate);
  }
  return map;
}

export async function getLatestCdiRate(): Promise<{ date: string; dailyRate: number } | null> {
  const latest = await CdiRate.findOne().sort({ date: -1 });
  if (latest) {
    return { date: latest.date, dailyRate: latest.dailyRate };
  }

  try {
    const bcbLatest = await fetchLatestBcbEntry();
    await saveRates([bcbLatest]);
    return bcbLatest;
  } catch {
    return null;
  }
}

function countBusinessDays(startDate: string, endDate: string): number {
  let count = 0;
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export async function ensureCdiRatesForRange(startDate: string, endDate: string): Promise<boolean> {
  const safeEndDate = minIsoDate(endDate, isoToday());

  const existingCount = await CdiRate.countDocuments({
    date: { $gte: startDate, $lte: safeEndDate }
  });

  const expectedBusinessDays = countBusinessDays(startDate, safeEndDate);

  if (expectedBusinessDays > 0 && existingCount >= expectedBusinessDays * 0.8) {
    return true;
  }

  try {
    const synced = await syncCdiRates(startDate, safeEndDate);
    if (synced > 0) return true;
  } catch (error) {
    console.error('Erro ao sincronizar CDI por intervalo:', error);
  }

  try {
    await saveRates(await fetchRecentCdiRatesFromBcb(500));
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar CDI recente:', error);
    return false;
  }
}

export async function syncRecentCdiRates(daysBack = 730): Promise<number> {
  const endDate = isoToday();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const startDate = start.toISOString().split('T')[0];

  try {
    const count = await syncCdiRates(startDate, endDate);
    if (count > 0) return count;
  } catch (error) {
    console.error('Erro ao sincronizar CDI por intervalo completo:', error);
  }

  return saveRates(await fetchRecentCdiRatesFromBcb(500));
}
