import { Entity, PrimaryKey, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';

@Entity({ tableName: 'user_companies' })
@Unique({ properties: ['userId', 'company'] })
export class UserCompany {
  @PrimaryKey()
  id!: number;

  @Property({ length: 36 })
  userId!: string;

  @ManyToOne(() => Company, { deleteRule: 'cascade' })
  company!: Company;

  @Property()
  createdAt: Date = new Date();
}
