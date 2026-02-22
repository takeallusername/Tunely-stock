'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type SearchCompany = {
  corpCode: string;
  corpName: string;
  stockCode: string | null;
  modifyDate: string;
};

type Financial = {
  id: number;
  year: number;
  quarter: number;
  revenue?: string;
  operatingProfit?: string;
  netIncome?: string;
  collectedAt: string;
};

type StockData = {
  id: number;
  price?: number;
  per?: string;
  pbr?: string;
  foreignRatio?: string;
  collectedAt: string;
};

type StockHistory = {
  id: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
};

type Company = {
  id: number;
  corpCode: string;
  corpName: string;
  stockCode?: string;
  createdAt: string;
  financials?: Financial[];
  stockData?: StockData[];
  stockHistory?: StockHistory[];
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');
const LOCAL_TOKEN_KEY = 'tunely_user_token';

function issueSessionToken() {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류가 발생했습니다.';
}

function formatNumber(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('ko-KR').format(num);
}

function formatCurrency(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  if (Math.abs(num) >= 1e12) {
    return `${(num / 1e12).toFixed(2)}조`;
  }
  if (Math.abs(num) >= 1e8) {
    return `${(num / 1e8).toFixed(0)}억`;
  }
  return new Intl.NumberFormat('ko-KR').format(num);
}

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

type IconProps = { className?: string; style?: React.CSSProperties };

function SearchIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BuildingIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ChartIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function RefreshIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function DatabaseIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  );
}

function AlertIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function TrendingUpIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function TrashIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function Home() {
  const [sessionToken, setSessionToken] = useState('');
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeRegisterCode, setActiveRegisterCode] = useState<string | null>(null);
  const [activeCollectId, setActiveCollectId] = useState<number | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<number | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'1y' | '5y' | '10y' | 'all'>('1y');

  const registeredCorpCodes = useMemo(
    () => new Set(companies.map((c) => c.corpCode)),
    [companies]
  );

  const requestApi = useCallback(
    async (path: string, init: RequestInit = {}) => {
      if (!sessionToken) throw new Error('세션이 준비되지 않았습니다.');
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      headers.set('x-user-id', sessionToken);
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
      const ct = res.headers.get('content-type') ?? '';
      const payload = ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = typeof payload === 'string' ? payload : payload?.message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return payload;
    },
    [sessionToken]
  );

  const refreshCompanies = useCallback(async () => {
    if (!sessionToken) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const result = (await requestApi('/companies', { method: 'GET' })) as Company[];
      setCompanies(result);
    } catch (e) {
      setErrorMessage(toErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  }, [requestApi, sessionToken]);

  const loadCompanyDetail = useCallback(
    async (id: number) => {
      setIsDetailLoading(true);
      setErrorMessage(null);
      try {
        const detail = (await requestApi(`/companies/${id}`, { method: 'GET' })) as Company;
        setSelectedCompany(detail);
      } catch (e) {
        setErrorMessage(toErrorMessage(e));
      } finally {
        setIsDetailLoading(false);
      }
    },
    [requestApi]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (stored) {
      setSessionToken(stored);
      setIsSessionReady(true);
      return;
    }
    const created = issueSessionToken();
    window.localStorage.setItem(LOCAL_TOKEN_KEY, created);
    setSessionToken(created);
    setIsSessionReady(true);
  }, []);

  useEffect(() => {
    if (isSessionReady && sessionToken) {
      void refreshCompanies();
    }
  }, [refreshCompanies, sessionToken, isSessionReady]);

  async function handleSearch(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!isSessionReady) return;
    const name = searchTerm.trim();
    if (!name) return;
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const result = (await requestApi(
        `/companies/search?name=${encodeURIComponent(name)}`,
        { method: 'GET' }
      )) as SearchCompany[];
      setSearchResults(result);
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleRegister(company: SearchCompany) {
    if (!isSessionReady) return;
    setActiveRegisterCode(company.corpCode);
    setErrorMessage(null);
    try {
      await requestApi('/companies', {
        method: 'POST',
        body: JSON.stringify({
          corpCode: company.corpCode,
          corpName: company.corpName,
          stockCode: company.stockCode ?? undefined,
        }),
      });
      await refreshCompanies();
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setActiveRegisterCode(null);
    }
  }

  async function handleCollect(company: Company) {
    if (!isSessionReady) return;
    setActiveCollectId(company.id);
    setErrorMessage(null);
    try {
      await requestApi(`/companies/${company.id}/collect`, { method: 'POST' });
      await refreshCompanies();
      await loadCompanyDetail(company.id);
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setActiveCollectId(null);
    }
  }

  async function handleDelete(company: Company) {
    if (!isSessionReady) return;
    if (!confirm(`"${company.corpName}"을(를) 삭제하시겠습니까?`)) return;
    setActiveDeleteId(company.id);
    setErrorMessage(null);
    try {
      await requestApi(`/companies/${company.id}`, { method: 'DELETE' });
      if (selectedCompany?.id === company.id) {
        setSelectedCompany(null);
      }
      await refreshCompanies();
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setActiveDeleteId(null);
    }
  }

  const latestFinancial = selectedCompany?.financials?.[0];
  const latestStock = selectedCompany?.stockData?.[0];

  const filteredData = useMemo(() => {
    if (!selectedCompany) return { financials: [], stockHistory: [] };

    const now = new Date();
    const cutoffDate = new Date();
    const cutoffYear = now.getFullYear();

    switch (periodFilter) {
      case '1y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      case '5y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
        break;
      case '10y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);
        break;
      case 'all':
        cutoffDate.setFullYear(1900);
        break;
    }

    const yearLimit = periodFilter === '1y' ? 1 : periodFilter === '5y' ? 5 : periodFilter === '10y' ? 10 : 100;

    const financials = (selectedCompany.financials ?? []).filter(
      (f) => f.year >= cutoffYear - yearLimit
    );

    const stockHistory = (selectedCompany.stockHistory ?? []).filter(
      (h) => new Date(h.date) >= cutoffDate
    );

    return { financials, stockHistory };
  }, [selectedCompany, periodFilter]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-mark">
              <TrendingUpIcon />
            </div>
            <span className="logo-text">Tunely</span>
          </div>
          <div className="status-badge">
            <span className="status-dot" />
            Live
          </div>
        </div>
      </header>

      <main className="main-content">
        {errorMessage && (
          <div className="error-banner fade-in">
            <AlertIcon className="error-icon" />
            {errorMessage}
          </div>
        )}

        <div className="grid-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section className="panel fade-in stagger-1">
              <div className="panel-header">
                <h2 className="panel-title">
                  <SearchIcon className="panel-title-icon" />
                  기업 검색
                </h2>
              </div>
              <div className="panel-body">
                <form className="search-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="기업명 입력 (예: 삼성전자)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSearching || !searchTerm.trim() || !isSessionReady}
                  >
                    {isSearching ? <span className="loading-spinner" /> : '검색'}
                  </button>
                </form>
              </div>
              <div className="panel-body-flush">
                {searchResults.length === 0 ? (
                  <div className="empty-state">
                    <SearchIcon className="empty-icon" />
                    <p className="empty-text">DART에서 기업을 검색하세요</p>
                  </div>
                ) : (
                  <div className="company-list">
                    {searchResults.map((company) => {
                      const isRegistered = registeredCorpCodes.has(company.corpCode);
                      const isRegistering = activeRegisterCode === company.corpCode;
                      return (
                        <div key={company.corpCode} className="company-item">
                          <div className="company-info">
                            <div className="company-name">{company.corpName}</div>
                            <div className="company-meta">
                              <span>{company.corpCode}</span>
                              <span>{company.stockCode || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="company-actions">
                            {isRegistered ? (
                              <span className="tag tag-registered">등록됨</span>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                disabled={isRegistering || !isSessionReady}
                                onClick={() => void handleRegister(company)}
                              >
                                {isRegistering ? <span className="loading-spinner" /> : '등록'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="panel fade-in stagger-2">
              <div className="panel-header">
                <h2 className="panel-title">
                  <BuildingIcon className="panel-title-icon" />
                  등록된 기업
                </h2>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => void refreshCompanies()}
                  disabled={isRefreshing || !isSessionReady}
                  title="새로고침"
                >
                  <RefreshIcon style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div className="panel-body-flush">
                {companies.length === 0 ? (
                  <div className="empty-state">
                    <BuildingIcon className="empty-icon" />
                    <p className="empty-text">등록된 기업이 없습니다</p>
                  </div>
                ) : (
                  <div className="company-list">
                    {companies.map((company) => {
                      const isCollecting = activeCollectId === company.id;
                      const isSelected = selectedCompany?.id === company.id;
                      return (
                        <div
                          key={company.id}
                          className="company-item"
                          style={isSelected ? { background: 'var(--bg-tertiary)' } : undefined}
                        >
                          <div className="company-info">
                            <div className="company-name">{company.corpName}</div>
                            <div className="company-meta">
                              <span>{company.stockCode || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="company-actions">
                            <button
                              className="btn btn-ghost"
                              onClick={() => void loadCompanyDetail(company.id)}
                              disabled={!isSessionReady}
                            >
                              상세
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ height: 32, fontSize: 12 }}
                              disabled={isCollecting || !isSessionReady}
                              onClick={() => void handleCollect(company)}
                            >
                              {isCollecting ? <span className="loading-spinner" /> : '수집'}
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              style={{ color: 'var(--accent-rose)' }}
                              disabled={activeDeleteId === company.id || !isSessionReady}
                              onClick={() => void handleDelete(company)}
                              title="삭제"
                            >
                              {activeDeleteId === company.id ? (
                                <span className="loading-spinner" />
                              ) : (
                                <TrashIcon style={{ width: 14, height: 14 }} />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="fade-in stagger-3">
            {isDetailLoading ? (
              <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
                <span className="loading-spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : !selectedCompany ? (
              <div className="panel">
                <div className="empty-state" style={{ padding: '80px 20px' }}>
                  <ChartIcon className="empty-icon" />
                  <p className="empty-text">기업을 선택하면 상세 데이터가 표시됩니다</p>
                </div>
              </div>
            ) : (
              <div className="detail-container">
                <div className="detail-header">
                  <div className="detail-company-info">
                    <h2>{selectedCompany.corpName}</h2>
                    <div className="detail-company-codes">
                      <span>
                        <span className="code-label">CORP</span>
                        {selectedCompany.corpCode}
                      </span>
                      <span>
                        <span className="code-label">STOCK</span>
                        {selectedCompany.stockCode || 'N/A'}
                      </span>
                    </div>
                    <p className="detail-date">등록일: {formatDate(selectedCompany.createdAt)}</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    disabled={activeCollectId === selectedCompany.id || !isSessionReady}
                    onClick={() => void handleCollect(selectedCompany)}
                  >
                    {activeCollectId === selectedCompany.id ? (
                      <span className="loading-spinner" />
                    ) : (
                      <>
                        <DatabaseIcon style={{ width: 14, height: 14 }} />
                        데이터 수집
                      </>
                    )}
                  </button>
                </div>

                <div className="period-filter">
                  {(['1y', '5y', '10y', 'all'] as const).map((period) => (
                    <button
                      key={period}
                      className={`period-btn ${periodFilter === period ? 'active' : ''}`}
                      onClick={() => setPeriodFilter(period)}
                    >
                      {period === '1y' ? '1년' : period === '5y' ? '5년' : period === '10y' ? '10년' : '전체'}
                    </button>
                  ))}
                </div>

                {(latestFinancial || latestStock) && (
                  <div className="metrics-grid">
                    {latestStock?.price && (
                      <div className="metric-card">
                        <div className="metric-label">현재가</div>
                        <div className="metric-value">{formatNumber(latestStock.price)}원</div>
                      </div>
                    )}
                    {latestStock?.per && (
                      <div className="metric-card">
                        <div className="metric-label">PER</div>
                        <div className="metric-value">{latestStock.per}</div>
                      </div>
                    )}
                    {latestStock?.pbr && (
                      <div className="metric-card">
                        <div className="metric-label">PBR</div>
                        <div className="metric-value">{latestStock.pbr}</div>
                      </div>
                    )}
                    {latestStock?.foreignRatio && (
                      <div className="metric-card">
                        <div className="metric-label">외국인 보유</div>
                        <div className="metric-value">{latestStock.foreignRatio}%</div>
                      </div>
                    )}
                  </div>
                )}

                {filteredData.stockHistory.length > 0 && (
                  <div className="data-section">
                    <div className="data-section-header">
                      <h3 className="data-section-title">
                        <TrendingUpIcon style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />
                        주가 추이
                      </h3>
                      <span className="data-count">{filteredData.stockHistory.length}일</span>
                    </div>
                    <div style={{ padding: '16px 20px', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={filteredData.stockHistory.map((h) => {
                            const d = new Date(h.date);
                            const useYearFormat = periodFilter === '10y' || periodFilter === 'all';
                            return {
                              date: useYearFormat
                                ? d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' })
                                : d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                              fullDate: d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
                              close: h.close,
                            };
                          })}
                        >
                          <XAxis
                            dataKey="date"
                            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                            axisLine={{ stroke: 'var(--border-subtle)' }}
                            tickLine={false}
                            interval={Math.max(0, Math.floor(filteredData.stockHistory.length / 8) - 1)}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatNumber(v)}
                            width={70}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            labelStyle={{ color: 'var(--text-secondary)' }}
                            labelFormatter={(_, payload) => payload[0]?.payload?.fullDate ?? ''}
                            formatter={(value) => [`${formatNumber(value as number)}원`, '종가']}
                          />
                          <Line
                            type="monotone"
                            dataKey="close"
                            stroke="var(--accent-cyan)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: 'var(--accent-cyan)' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="data-section">
                  <div className="data-section-header">
                    <h3 className="data-section-title">
                      <ChartIcon style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />
                      재무 데이터
                    </h3>
                    <span className="data-count">{filteredData.financials.length}</span>
                  </div>
                  {filteredData.financials.length === 0 ? (
                    <div className="empty-state">
                      <p className="empty-text">수집된 재무 데이터가 없습니다</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>기간</th>
                          <th style={{ textAlign: 'right' }}>매출액</th>
                          <th style={{ textAlign: 'right' }}>영업이익</th>
                          <th style={{ textAlign: 'right' }}>당기순이익</th>
                          <th>수집일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.financials.map((f) => (
                          <tr key={f.id}>
                            <td className="mono">
                              {f.year}년 {f.quarter}Q
                            </td>
                            <td className="number">{formatCurrency(f.revenue)}</td>
                            <td className="number">{formatCurrency(f.operatingProfit)}</td>
                            <td className="number">{formatCurrency(f.netIncome)}</td>
                            <td className="date">{formatDate(f.collectedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="data-section">
                  <div className="data-section-header">
                    <h3 className="data-section-title">
                      <TrendingUpIcon style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />
                      주가 데이터
                    </h3>
                    <span className="data-count">{selectedCompany.stockData?.length ?? 0}</span>
                  </div>
                  {(selectedCompany.stockData?.length ?? 0) === 0 ? (
                    <div className="empty-state">
                      <p className="empty-text">수집된 주가 데이터가 없습니다</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'right' }}>현재가</th>
                          <th style={{ textAlign: 'right' }}>PER</th>
                          <th style={{ textAlign: 'right' }}>PBR</th>
                          <th style={{ textAlign: 'right' }}>외국인</th>
                          <th>수집일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompany.stockData?.map((s) => (
                          <tr key={s.id}>
                            <td className="number">{formatNumber(s.price)}원</td>
                            <td className="number">{s.per ?? '-'}</td>
                            <td className="number">{s.pbr ?? '-'}</td>
                            <td className="number">{s.foreignRatio ? `${s.foreignRatio}%` : '-'}</td>
                            <td className="date">{formatDate(s.collectedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
