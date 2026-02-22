'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, getSessionToken } from '@/lib/api';
import { toErrorMessage, formatNumber, formatCurrency } from '@/lib/utils';
import type { Company, SearchCompany } from '@/lib/types';
import {
  SearchIcon,
  BuildingIcon,
  TrendingUpIcon,
  TrashIcon,
  RefreshIcon,
  AlertIcon,
  PlusIcon,
  DatabaseIcon,
  CurrencyIcon,
  ScaleIcon,
  PercentIcon,
  BanknotesIcon,
} from '@/components/icons';

export default function Dashboard() {
  const [isReady, setIsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeRegisterCode, setActiveRegisterCode] = useState<string | null>(null);
  const [activeCollectId, setActiveCollectId] = useState<number | null>(null);
  const [activeDeleteId, setActiveDeleteId] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const registeredCorpCodes = useMemo(
    () => new Set(companies.map((c) => c.corpCode)),
    [companies]
  );

  const refreshCompanies = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const result = await api.getCompanies();
      setCompanies(result);
    } catch (e) {
      setErrorMessage(toErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getSessionToken();
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      void refreshCompanies();
    }
  }, [isReady, refreshCompanies]);

  async function handleSearch(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!isReady) return;
    const name = searchTerm.trim();
    if (!name) return;
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const result = await api.searchCompanies(name);
      setSearchResults(result);
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleRegister(company: SearchCompany) {
    if (!isReady) return;
    setActiveRegisterCode(company.corpCode);
    setErrorMessage(null);
    try {
      await api.registerCompany({
        corpCode: company.corpCode,
        corpName: company.corpName,
        stockCode: company.stockCode ?? undefined,
      });
      await refreshCompanies();
      setShowSearch(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setActiveRegisterCode(null);
    }
  }

  async function handleCollect(companyId: number) {
    if (!isReady) return;
    setActiveCollectId(companyId);
    setErrorMessage(null);
    try {
      await api.collectData(companyId);
      await refreshCompanies();
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setActiveCollectId(null);
    }
  }

  async function handleDelete(company: Company) {
    if (!isReady) return;
    if (!confirm(`"${company.corpName}"을(를) 삭제하시겠습니까?`)) return;
    setActiveDeleteId(company.id);
    setErrorMessage(null);
    try {
      await api.deleteCompany(company.id);
      await refreshCompanies();
    } catch (err) {
      setErrorMessage(toErrorMessage(err));
    } finally {
      setActiveDeleteId(null);
    }
  }

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
          <div className="header-actions">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => void refreshCompanies()}
              disabled={isRefreshing || !isReady}
              title="새로고침"
            >
              <RefreshIcon style={{ width: 16, height: 16 }} />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowSearch(true)}
              disabled={!isReady}
            >
              <PlusIcon style={{ width: 16, height: 16 }} />
              기업 추가
            </button>
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

        {showSearch && (
          <div className="modal-overlay" onClick={() => setShowSearch(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>기업 검색</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowSearch(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <form className="search-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="기업명 입력 (예: 삼성전자)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSearching || !searchTerm.trim()}
                  >
                    {isSearching ? <span className="loading-spinner" /> : '검색'}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((company) => {
                      const isRegistered = registeredCorpCodes.has(company.corpCode);
                      const isRegistering = activeRegisterCode === company.corpCode;
                      return (
                        <div key={company.corpCode} className="search-result-item">
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
                                disabled={isRegistering}
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

                {searchResults.length === 0 && searchTerm && !isSearching && (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <SearchIcon className="empty-icon" />
                    <p className="empty-text">DART에서 기업을 검색하세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {companies.length === 0 ? (
          <div className="empty-dashboard fade-in">
            <BuildingIcon className="empty-icon-large" />
            <h2>등록된 기업이 없습니다</h2>
            <p>기업을 추가하여 재무 데이터를 수집해보세요</p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowSearch(true)}>
              <PlusIcon style={{ width: 18, height: 18 }} />
              첫 번째 기업 추가하기
            </button>
          </div>
        ) : (
          <div className="company-grid fade-in">
            {companies.map((company) => {
              const latestStock = company.stockData?.[0];
              const latestFinancial = company.financials?.[0];
              const isCollecting = activeCollectId === company.id;
              const isDeleting = activeDeleteId === company.id;

              return (
                <div key={company.id} className="company-card">
                  <div className="company-card-header">
                    <Link href={`/company/${company.id}`} className="company-card-title">
                      {company.corpName}
                    </Link>
                    <div className="company-card-actions">
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        disabled={isCollecting}
                        onClick={() => void handleCollect(company.id)}
                        title="데이터 수집"
                      >
                        {isCollecting ? (
                          <span className="loading-spinner" />
                        ) : (
                          <DatabaseIcon style={{ width: 14, height: 14 }} />
                        )}
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--accent-rose)' }}
                        disabled={isDeleting}
                        onClick={() => void handleDelete(company)}
                        title="삭제"
                      >
                        {isDeleting ? (
                          <span className="loading-spinner" />
                        ) : (
                          <TrashIcon style={{ width: 14, height: 14 }} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="company-card-code">
                    {company.stockCode || company.corpCode}
                  </div>

                  {latestStock ? (
                    <div className="company-card-metrics">
                      <div className="metric-row">
                        <span className="metric-label">
                          <CurrencyIcon className="metric-icon accent-cyan" />
                          현재가
                        </span>
                        <span className="metric-value accent-cyan">{formatNumber(latestStock.price)}원</span>
                      </div>
                      {latestStock.per && (
                        <div className="metric-row">
                          <span className="metric-label">
                            <ScaleIcon className="metric-icon accent-amber" />
                            PER
                          </span>
                          <span className="metric-value">{latestStock.per}</span>
                        </div>
                      )}
                      {latestStock.pbr && (
                        <div className="metric-row">
                          <span className="metric-label">
                            <PercentIcon className="metric-icon accent-violet" />
                            PBR
                          </span>
                          <span className="metric-value">{latestStock.pbr}</span>
                        </div>
                      )}
                      {latestFinancial && (
                        <div className="metric-row">
                          <span className="metric-label">
                            <BanknotesIcon className="metric-icon accent-emerald" />
                            매출액
                          </span>
                          <span className="metric-value">{formatCurrency(latestFinancial.revenue)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="company-card-empty">
                      <DatabaseIcon className="empty-card-icon" />
                      <p>데이터를 수집해주세요</p>
                    </div>
                  )}

                  <Link href={`/company/${company.id}`} className="company-card-link">
                    상세 보기 →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
