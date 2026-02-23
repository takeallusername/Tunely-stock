import { Entity, PrimaryKey, Property, ManyToOne, Unique, OptionalProps } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';
import { UserCompanyRepository } from '../repositories/user-company.repository';

@Entity({ tableName: 'user_companies', repository: () => UserCompanyRepository })
@Unique({ properties: ['userId', 'company'] })
export class UserCompany {
  [OptionalProps]?: 'createdAt';

  @PrimaryKey()
  id!: number;

  @Property({ length: 36 })
  userId!: string;

  @ManyToOne(() => Company, { deleteRule: 'cascade' })
  company!: Company;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;
}
