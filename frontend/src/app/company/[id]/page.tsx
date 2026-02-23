'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, getSessionToken } from '@/lib/api';
import { toErrorMessage, formatNumber, formatCurrency, formatDate } from '@/lib/utils';
import type { Company, Financial, StockHistory } from '@/lib/types';
import {
  ArrowLeftIcon,
  TrendingUpIcon,
  ChartIcon,
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

type QuarterDetail = {
  financial: Financial | null;
  stockHistory: StockHistory[];
};

export default function CompanyDetail() {
  const params = useParams();
  const router = useRouter();
  const companyId = Number(params.id);

  const [isReady, setIsReady] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<{ year: number; quarter: number } | null>(null);
  const [quarterDetail, setQuarterDetail] = useState<QuarterDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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

  async function handleViewQuarter(year: number, quarter: number) {
    setSelectedQuarter({ year, quarter });
    setIsLoadingDetail(true);
    setErrorMessage(null);
    try {
      const data = await api.getQuarterDetail(companyId, year, quarter);
      setQuarterDetail(data);
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function closeModal() {
    setSelectedQuarter(null);
    setQuarterDetail(null);
  }

  const latestFinancial = company?.financials?.[0];
  const latestStock = company?.stockData?.[0];

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
            <div className="data-section fade-in">
              <div className="data-section-header">
                <h3 className="data-section-title">
                  <ChartIcon style={{ width: 14, height: 14, color: 'var(--text-tertiary)' }} />
                  재무 데이터
                </h3>
                <span className="data-count">{company.financials?.length ?? 0}</span>
              </div>
              {(company.financials?.length ?? 0) === 0 ? (
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.financials?.map((f) => (
                      <tr key={f.id}>
                        <td className="mono">
                          {f.year}년 {f.quarter}Q
                        </td>
                        <td className="number">{formatCurrency(f.revenue)}</td>
                        <td className="number">{formatCurrency(f.operatingProfit)}</td>
                        <td className="number">{formatCurrency(f.netIncome)}</td>
                        <td className="date">{formatDate(f.collectedAt)}</td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleViewQuarter(f.year, f.quarter)}
                            style={{ fontSize: 12, padding: '4px 12px' }}
                          >
                            상세보기 →
                          </button>
                        </td>
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

      {selectedQuarter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedQuarter.year}년 {selectedQuarter.quarter}분기 상세
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {isLoadingDetail ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <span className="loading-spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : quarterDetail ? (
                <>
                  {quarterDetail.stockHistory.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        주가 추이
                      </h3>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={quarterDetail.stockHistory.map((h) => ({
                              date: new Date(h.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                              fullDate: new Date(h.date).toLocaleDateString('ko-KR'),
                              close: h.close,
                            }))}
                          >
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                              axisLine={{ stroke: 'var(--border-subtle)' }}
                              tickLine={false}
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
                  {quarterDetail.financial && (
                    <div>
                      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        재무 정보
                      </h3>
                      <dl style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <dt style={{ color: 'var(--text-secondary)' }}>매출액</dt>
                          <dd style={{ fontWeight: 500 }}>{formatCurrency(quarterDetail.financial.revenue)}</dd>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <dt style={{ color: 'var(--text-secondary)' }}>영업이익</dt>
                          <dd style={{ fontWeight: 500 }}>{formatCurrency(quarterDetail.financial.operatingProfit)}</dd>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <dt style={{ color: 'var(--text-secondary)' }}>당기순이익</dt>
                          <dd style={{ fontWeight: 500 }}>{formatCurrency(quarterDetail.financial.netIncome)}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>데이터를 불러올 수 없습니다</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
