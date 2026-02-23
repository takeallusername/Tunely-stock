import { UserCompany } from '../entities/user-company.entity';
import { Company } from '../../company/entities/company.entity';
import { BaseRepository } from '../../common/base.repository';

export class UserCompanyRepository extends BaseRepository<UserCompany> {
  async findByUserAndCompany(userId: string, company: Company): Promise<UserCompany | null> {
    return this.findOne({ userId, company });
  }

  async findByUserId(userId: string) {
    return this.find(
      { userId },
      { populate: ['company', 'company.stockData', 'company.financials'] },
    );
  }

  async findByUserAndCompanyId(userId: string, companyId: number): Promise<UserCompany | null> {
    return this.findOne({ userId, company: { id: companyId } });
  }
}
