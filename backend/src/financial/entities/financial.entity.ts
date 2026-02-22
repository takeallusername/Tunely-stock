import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';

@Entity({ tableName: 'financials' })
export class Financial {
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

  @Property()
  collectedAt: Date = new Date();
}
