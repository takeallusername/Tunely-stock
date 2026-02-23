import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';
import { FinancialRepository } from '../repositories/financial.repository';

@Entity({ tableName: 'financials', repository: () => FinancialRepository })
export class Financial {
  [OptionalProps]?: 'collectedAt';

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Company, { deleteRule: 'cascade' })
  company!: Company;

  @Property()
  year!: number;

  @Property()
  quarter!: number;

  @Property({ type: 'bigint', nullable: true })
  revenue?: string;

  @Property({ type: 'bigint', nullable: true })
  operatingProfit?: string;

  @Property({ type: 'bigint', nullable: true })
  netIncome?: string;

  @Property({ onCreate: () => new Date() })
  collectedAt!: Date;
}
