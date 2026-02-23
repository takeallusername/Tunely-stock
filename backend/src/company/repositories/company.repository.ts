import { Company } from '../entities/company.entity';
import { BaseRepository } from '../../common/base.repository';

export class CompanyRepository extends BaseRepository<Company> {
  async findByCorpCode(corpCode: string): Promise<Company | null> {
    return this.findOne({ corpCode });
  }

  async findByIdWithRelations(id: number) {
    return this.findOne(
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
}
