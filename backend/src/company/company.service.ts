import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Company } from './entities/company.entity';
import { Financial } from '../financial/entities/financial.entity';
import { StockData } from '../stock/entities/stock-data.entity';
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
    const company = new Company();
    company.userId = userId;
    company.corpCode = corpCode;
    company.corpName = corpName;
    company.stockCode = stockCode;

    await this.em.persistAndFlush(company);
    return company;
  }

  async findAll(userId: string) {
    return this.em.find(Company, { userId });
  }

  async findOne(id: number) {
    return this.em.findOne(
      Company,
      { id },
      { populate: ['financials', 'stockData'] },
    );
  }

  async collect(id: number) {
    const company = await this.em.findOneOrFail(Company, { id });

    const results = {
      financial: false,
      stock: false,
    };

    const currentYear = new Date().getFullYear();
    const financialData = await this.dartService.getFinancialStatements(
      company.corpCode,
      String(currentYear - 1),
    );

    if (financialData.length > 0) {
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
      financial.year = currentYear - 1;
      financial.quarter = 4;
      financial.revenue = revenue?.thstrm_amount?.replace(/,/g, '');
      financial.operatingProfit =
        operatingProfit?.thstrm_amount?.replace(/,/g, '');
      financial.netIncome = netIncome?.thstrm_amount?.replace(/,/g, '');

      await this.em.persistAndFlush(financial);
      results.financial = true;
    }

    if (company.stockCode) {
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
      results.stock = true;
    }

    return results;
  }
}
