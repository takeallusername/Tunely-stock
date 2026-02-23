import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Company } from './entities/company.entity';
import { UserCompany } from '../user-company/entities/user-company.entity';
import { Financial } from '../financial/entities/financial.entity';
import { StockData } from '../stock/entities/stock-data.entity';
import { StockHistory } from '../stock/entities/stock-history.entity';
import { DartService } from '../dart/dart.service';
import { NaverFinanceService } from '../crawler/naver-finance.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly em: EntityManager,
    private readonly dartService: DartService,
    private readonly naverFinanceService: NaverFinanceService,
  ) {}

  async search(name: string) {
    return this.dartService.searchCompanyByName(name);
  }

  async register(userId: string, corpCode: string, corpName: string, stockCode?: string) {
    let company = await this.em.findOne(Company, { corpCode });

    if (!company) {
      company = new Company();
      company.corpCode = corpCode;
      company.corpName = corpName;
      company.stockCode = stockCode;
      this.em.persist(company);
    }

    const existingLink = await this.em.findOne(UserCompany, { userId, company });
    if (existingLink) {
      return company;
    }

    const userCompany = new UserCompany();
    userCompany.userId = userId;
    userCompany.company = company;

    await this.em.persistAndFlush(userCompany);
    return company;
  }

  async findAll(userId: string): Promise<Company[]> {
    const userCompanies = await this.em.find(
      UserCompany,
      { userId },
      { populate: ['company', 'company.stockData', 'company.financials'] },
    );
    return userCompanies.map((uc) => uc.company);
  }

  async findOne(id: number) {
    return this.em.findOne(
      Company,
      { id },
      {
        populate: ['financials', 'stockData'],
        populateOrderBy: {
          financials: { year: 'desc', quarter: 'desc' },
          stockData: { collectedAt: 'desc' },
        },
      },
    );
  }

  async getQuarterDetail(id: number, year: number, quarter: number) {
    const company = await this.em.findOneOrFail(Company, { id });

    const financial = await this.em.findOne(Financial, {
      company,
      year,
      quarter,
    });

    if (!company.stockCode) {
      return { financial, stockHistory: [] };
    }

    const quarterStartMonth = (quarter - 1) * 3 + 1;
    const quarterEndMonth = quarter * 3;

    const startDate = new Date(year, quarterStartMonth - 1, 1);
    const endDate = new Date(year, quarterEndMonth, 0);

    const stockHistory = await this.em.find(
      StockHistory,
      {
        company,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      { orderBy: { date: 'asc' } },
    );

    return { financial, stockHistory };
  }

  async delete(id: number, userId: string) {
    const userCompany = await this.em.findOne(UserCompany, { userId, company: { id } });
    if (!userCompany) {
      return null;
    }
    await this.em.removeAndFlush(userCompany);
    return { deleted: true };
  }

  async collect(id: number) {
    const company = await this.em.findOneOrFail(Company, { id });

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
        const existingFinancial = await this.em.findOne(Financial, {
          company,
          year: targetYear,
          quarter,
        });

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

        const financial = new Financial();
        financial.company = company;
        financial.year = targetYear;
        financial.quarter = quarter;
        financial.revenue = revenue?.thstrm_amount?.replace(/,/g, '');
        financial.operatingProfit =
          operatingProfit?.thstrm_amount?.replace(/,/g, '');
        financial.netIncome = netIncome?.thstrm_amount?.replace(/,/g, '');

        this.em.persist(financial);
        results.financial = true;
      }
    }

    await this.em.flush();

    if (company.stockCode) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingStock = await this.em.findOne(StockData, {
        company,
        collectedAt: { $gte: today },
      });

      if (!existingStock) {
        const stockInfo = await this.naverFinanceService.getStockInfo(
          company.stockCode,
        );

        const stockData = new StockData();
        stockData.company = company;
        stockData.price = stockInfo.price ?? undefined;
        stockData.per = stockInfo.per?.toString();
        stockData.pbr = stockInfo.pbr?.toString();
        stockData.foreignRatio = stockInfo.foreignRatio?.toString();

        await this.em.persistAndFlush(stockData);
      }
      results.stock = true;

      const historyData = await this.naverFinanceService.getStockHistory(
        company.stockCode,
        600,
      );

      for (const item of historyData) {
        const existing = await this.em.findOne(StockHistory, {
          company,
          date: item.date,
        });

        if (!existing) {
          const history = new StockHistory();
          history.company = company;
          history.date = item.date;
          history.open = item.open;
          history.high = item.high;
          history.low = item.low;
          history.close = item.close;
          history.volume = item.volume;
          this.em.persist(history);
        }
      }

      await this.em.flush();
      results.history = true;
    }

    return results;
  }
}
