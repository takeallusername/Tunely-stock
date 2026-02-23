import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Company } from './entities/company.entity';
import { UserCompany } from '../user-company/entities/user-company.entity';
import { Financial } from '../financial/entities/financial.entity';
import { StockData } from '../stock/entities/stock-data.entity';
import { StockHistory } from '../stock/entities/stock-history.entity';
import { CompanyRepository } from './repositories/company.repository';
import { UserCompanyRepository } from '../user-company/repositories/user-company.repository';
import { FinancialRepository } from '../financial/repositories/financial.repository';
import { StockDataRepository } from '../stock/repositories/stock-data.repository';
import { StockHistoryRepository } from '../stock/repositories/stock-history.repository';
import { DartService } from '../dart/dart.service';
import { NaverFinanceService } from '../crawler/naver-finance.service';
import { EntityManager } from '@mikro-orm/mysql';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: CompanyRepository,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepo: UserCompanyRepository,
    @InjectRepository(Financial)
    private readonly financialRepo: FinancialRepository,
    @InjectRepository(StockData)
    private readonly stockDataRepo: StockDataRepository,
    @InjectRepository(StockHistory)
    private readonly stockHistoryRepo: StockHistoryRepository,
    private readonly em: EntityManager,
    private readonly dartService: DartService,
    private readonly naverFinanceService: NaverFinanceService,
  ) {}

  async search(name: string) {
    return this.dartService.searchCompanyByName(name);
  }

  async register(userId: string, corpCode: string, corpName: string, stockCode?: string) {
    let company = await this.companyRepo.findByCorpCode(corpCode);
    let isNewCompany = false;

    if (!company) {
      company = this.em.create(Company, {
        corpCode,
        corpName,
        stockCode,
      });
      this.companyRepo.persist(company);
      isNewCompany = true;
    }

    const existingLink = await this.userCompanyRepo.findByUserAndCompany(userId, company);
    if (existingLink) {
      return company;
    }

    const userCompany = this.em.create(UserCompany, {
      userId,
      company,
    });

    await this.em.flush();

    if (isNewCompany) {
      await this.collect(company.id);
    }

    return {
      id: company.id,
      corpCode: company.corpCode,
      corpName: company.corpName,
      stockCode: company.stockCode,
      createdAt: company.createdAt,
    };
  }

  async findAll(userId: string): Promise<Company[]> {
    const userCompanies = await this.userCompanyRepo.findByUserId(userId);
    return userCompanies.map((uc) => uc.company);
  }

  async findOne(id: number) {
    return this.companyRepo.findByIdWithRelations(id);
  }

  async getQuarterDetail(id: number, year: number, quarter: number) {
    const company = await this.companyRepo.findOneOrFail({ id });

    const financial = await this.financialRepo.findByCompanyYearQuarter(
      company,
      year,
      quarter,
    );

    if (!company.stockCode) {
      return { financial, stockHistory: [] };
    }

    const quarterStartMonth = (quarter - 1) * 3 + 1;
    const quarterEndMonth = quarter * 3;

    const startDate = new Date(year, quarterStartMonth - 1, 1);
    const endDate = new Date(year, quarterEndMonth, 0);

    const stockHistory = await this.stockHistoryRepo.findByCompanyAndDateRange(
      company,
      startDate,
      endDate,
    );

    return { financial, stockHistory };
  }

  async delete(id: number, userId: string) {
    const userCompany = await this.userCompanyRepo.findByUserAndCompanyId(userId, id);
    if (!userCompany) {
      return null;
    }
    await this.userCompanyRepo.removeAndFlush(userCompany);
    return { deleted: true };
  }

  async collect(id: number) {
    const company = await this.companyRepo.findOneOrFail({ id });

    const results = {
      financial: false,
      stock: false,
      history: false,
    };

    const currentYear = new Date().getFullYear();
    const yearsToCollect = Array.from({ length: 20 }, (_, i) => currentYear - 1 - i);
    const quarters = [
      { quarter: 1, reportCode: '11013' },
      { quarter: 2, reportCode: '11012' },
      { quarter: 3, reportCode: '11014' },
      { quarter: 4, reportCode: '11011' },
    ];

    for (const targetYear of yearsToCollect) {
      for (const { quarter, reportCode } of quarters) {
        const existingFinancial = await this.financialRepo.findByCompanyYearQuarter(
          company,
          targetYear,
          quarter,
        );

        if (existingFinancial) continue;

        const financialData = await this.dartService.getFinancialStatements(
          company.corpCode,
          String(targetYear),
          reportCode,
        );

        if (financialData.length === 0) continue;

        const revenue = financialData.find(
          (item) => item.account_nm === '매출액' && item.fs_div === 'CFS',
        );
        const operatingProfit = financialData.find(
          (item) => item.account_nm === '영업이익' && item.fs_div === 'CFS',
        );
        const netIncome = financialData.find(
          (item) => item.account_nm === '당기순이익' && item.fs_div === 'CFS',
        );

        const financial = this.em.create(Financial, {
          company,
          year: targetYear,
          quarter,
          revenue: revenue?.thstrm_amount?.replace(/,/g, ''),
          operatingProfit: operatingProfit?.thstrm_amount?.replace(/,/g, ''),
          netIncome: netIncome?.thstrm_amount?.replace(/,/g, ''),
        });

        this.financialRepo.persist(financial);
        results.financial = true;
      }
    }

    await this.em.flush();

    if (company.stockCode) {
      const existingStock = await this.stockDataRepo.findTodayData(company);

      if (!existingStock) {
        const stockInfo = await this.naverFinanceService.getStockInfo(
          company.stockCode,
        );

        const stockData = this.em.create(StockData, {
          company,
          price: stockInfo.price ?? undefined,
          per: stockInfo.per?.toString(),
          pbr: stockInfo.pbr?.toString(),
          foreignRatio: stockInfo.foreignRatio?.toString(),
        });

        await this.stockDataRepo.persistAndFlush(stockData);
      }
      results.stock = true;

      const historyData = await this.naverFinanceService.getStockHistory(
        company.stockCode,
        600,
      );

      for (const item of historyData) {
        const existing = await this.stockHistoryRepo.findByCompanyAndDate(
          company,
          item.date,
        );

        if (!existing) {
          const history = this.em.create(StockHistory, {
            company,
            date: item.date,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          });
          this.stockHistoryRepo.persist(history);
        }
      }

      await this.em.flush();
      results.history = true;
    }

    return results;
  }
}
