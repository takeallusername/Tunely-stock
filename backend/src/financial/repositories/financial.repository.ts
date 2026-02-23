import { Financial } from '../entities/financial.entity';
import { Company } from '../../company/entities/company.entity';
import { BaseRepository } from '../../common/base.repository';

export class FinancialRepository extends BaseRepository<Financial> {
  async findByCompanyYearQuarter(
    company: Company,
    year: number,
    quarter: number,
  ): Promise<Financial | null> {
    return this.findOne({ company, year, quarter });
  }
}
