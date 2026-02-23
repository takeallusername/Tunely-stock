import { StockHistory } from '../entities/stock-history.entity';
import { Company } from '../../company/entities/company.entity';
import { BaseRepository } from '../../common/base.repository';

export class StockHistoryRepository extends BaseRepository<StockHistory> {
  async findByCompanyAndDate(company: Company, date: Date): Promise<StockHistory | null> {
    return this.findOne({ company, date });
  }

  async findByCompanyAndDateRange(
    company: Company,
    startDate: Date,
    endDate: Date,
  ): Promise<StockHistory[]> {
    return this.find(
      {
        company,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      { orderBy: { date: 'asc' } },
    );
  }
}
