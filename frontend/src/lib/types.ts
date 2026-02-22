export type SearchCompany = {
  corpCode: string;
  corpName: string;
  stockCode: string | null;
  modifyDate: string;
};

export type Financial = {
  id: number;
  year: number;
  quarter: number;
  revenue?: string;
  operatingProfit?: string;
  netIncome?: string;
  collectedAt: string;
};

export type StockData = {
  id: number;
  price?: number;
  per?: string;
  pbr?: string;
  foreignRatio?: string;
  collectedAt: string;
};

export type StockHistory = {
  id: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
};

export type Company = {
  id: number;
  corpCode: string;
  corpName: string;
  stockCode?: string;
  createdAt: string;
  financials?: Financial[];
  stockData?: StockData[];
  stockHistory?: StockHistory[];
};
