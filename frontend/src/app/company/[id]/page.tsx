'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, getSessionToken } from '@/lib/api';
import { toErrorMessage, formatNumber, formatCurrency, formatDate } from '@/lib/utils';
import type { Company } from '@/lib/types';
import {
  ArrowLeftIcon,
  TrendingUpIcon,
  ChartIcon,
  DatabaseIcon,
  AlertIcon,
  HashIcon,
  TagIcon,
  CalendarIcon,
  CurrencyIcon,
  PercentIcon,
  GlobeIcon,
  ScaleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
} from '@/components/icons';

export default function CompanyDetail() {
  const params = useParams();
  const router = useRouter();
  const companyId = Number(params.id);

  const [isReady, setIsReady] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'1y' | '5y' | '10y' | 'all'>('1y');

  const loadCompany = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getCompany(companyId);
      setCompany(data);
    } catch (e) {
      setErrorMessage(toErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    getSessionToken();
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      void loadCompany();
    }
  }, [isReady, loadCompany]);

  async function handleCollect() {
    if (!isReady || !companyId) return;
    setIsCollecting(true);
    setErrorMessage(null);
    try {
      await api.collectData(companyId);
      await loadCompany();
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setIsCollecting(false);
    }
  }

  const latestFinancial = company?.financials?.[0];
  const latestStock = company?.stockData?.[0];

  const filteredData = useMemo(() => {
    if (!company) return { financials: [], stockHistory: [] };

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

    const financials = (company.financials ?? []).filter(
      (f) => f.year >= cutoffYear - yearLimit
    );

    const stockHistory = (company.stockHistory ?? []).filter(
      (h) => new Date(h.date) >= cutoffDate
    );

    return { financials, stockHistory };
  }, [company, periodFilter]);

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-page">
          <span className="loading-spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="app-container">
        <div className="error-page">
          <AlertIcon className="empty-icon-large" />
          <h2>기업을 찾을 수 없습니다</h2>
          <Link href="/" className="btn btn-primary">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <button className="btn btn-ghost btn-icon" onClick={() => router.back()}>
              <ArrowLeftIcon style={{ width: 18, height: 18 }} />
            </button>
            <div className="header-title">
              <h1>{company.corpName}</h1>
              <span className="header-subtitle">{company.stockCode || company.corpCode}</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            disabled={isCollecting || !isReady}
            onClick={() => void handleCollect()}
          >
            {isCollecting ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <DatabaseIcon style={{ width: 14, height: 14 }} />
                데이터 수집
              </>
            )}
          </button>
        </div>
      </header>

      <main className="main-content detail-page">
        {errorMessage && (
          <div className="error-banner fade-in">
            <AlertIcon className="error-icon" />
            {errorMessage}
          </div>
        )}

        <div className="detail-grid">
          <div className="detail-main">
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

            {filteredData.stockHistory.length > 0 && (
              <div className="data-section fade-in">
                <div className="data-section-header">
                  <h3 className="data-section-title">
                    <TrendingUpIcon style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />
                    주가 추이
                  </h3>
                  <span className="data-count">{filteredData.stockHistory.length}일</span>
                </div>
                <div style={{ padding: '16px 20px', height: 320 }}>
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

            <div className="data-section fade-in">
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

            <div className="data-section fade-in">
              <div className="data-section-header">
                <h3 className="data-section-title">
                  <TrendingUpIcon style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />
                  주가 데이터
                </h3>
                <span className="data-count">{company.stockData?.length ?? 0}</span>
              </div>
              {(company.stockData?.length ?? 0) === 0 ? (
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
                    {company.stockData?.map((s) => (
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

          <div className="detail-sidebar">
            <div className="sidebar-card">
              <h3>기업 정보</h3>
              <dl className="info-list">
                <div className="info-item">
                  <dt>
                    <HashIcon className="info-icon" />
                    기업코드
                  </dt>
                  <dd className="mono">{company.corpCode}</dd>
                </div>
                <div className="info-item">
                  <dt>
                    <TagIcon className="info-icon" />
                    종목코드
                  </dt>
                  <dd className="mono">{company.stockCode || '-'}</dd>
                </div>
                <div className="info-item">
                  <dt>
                    <CalendarIcon className="info-icon" />
                    등록일
                  </dt>
                  <dd>{formatDate(company.createdAt)}</dd>
                </div>
              </dl>
            </div>

            {(latestFinancial || latestStock) && (
              <div className="sidebar-card">
                <h3>최신 지표</h3>
                <div className="metrics-list">
                  {latestStock?.price && (
                    <div className="metric-item">
                      <span className="metric-label">
                        <CurrencyIcon className="metric-icon accent-cyan" />
                        현재가
                      </span>
                      <span className="metric-value accent-cyan">{formatNumber(latestStock.price)}원</span>
                    </div>
                  )}
                  {latestStock?.per && (
                    <div className="metric-item">
                      <span className="metric-label">
                        <ScaleIcon className="metric-icon accent-amber" />
                        PER
                      </span>
                      <span className="metric-value">{latestStock.per}</span>
                    </div>
                  )}
                  {latestStock?.pbr && (
                    <div className="metric-item">
                      <span className="metric-label">
                        <PercentIcon className="metric-icon accent-violet" />
                        PBR
                      </span>
                      <span className="metric-value">{latestStock.pbr}</span>
                    </div>
                  )}
                  {latestStock?.foreignRatio && (
                    <div className="metric-item">
                      <span className="metric-label">
                        <GlobeIcon className="metric-icon accent-emerald" />
                        외국인 보유
                      </span>
                      <span className="metric-value accent-emerald">{latestStock.foreignRatio}%</span>
                    </div>
                  )}
                  {latestFinancial?.revenue && (
                    <div className="metric-item highlight">
                      <span className="metric-label">
                        <BanknotesIcon className="metric-icon accent-cyan" />
                        매출액 <span className="metric-period">({latestFinancial.year} {latestFinancial.quarter}Q)</span>
                      </span>
                      <span className="metric-value">{formatCurrency(latestFinancial.revenue)}</span>
                    </div>
                  )}
                  {latestFinancial?.operatingProfit && (
                    <div className="metric-item">
                      <span className="metric-label">
                        <ArrowTrendingUpIcon className="metric-icon accent-emerald" />
                        영업이익
                      </span>
                      <span className="metric-value">{formatCurrency(latestFinancial.operatingProfit)}</span>
                    </div>
                  )}
                  {latestFinancial?.netIncome && (
                    <div className="metric-item">
                      <span className="metric-label">
                        <ChartIcon className="metric-icon accent-amber" />
                        당기순이익
                      </span>
                      <span className="metric-value">{formatCurrency(latestFinancial.netIncome)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
