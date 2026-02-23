import { StockData } from '../entities/stock-data.entity';
import { Company } from '../../company/entities/company.entity';
import { BaseRepository } from '../../common/base.repository';

export class StockDataRepository extends BaseRepository<StockData> {
  async findTodayData(company: Company): Promise<StockData | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.findOne({
      company,
      collectedAt: { $gte: today },
    });
  }
}
