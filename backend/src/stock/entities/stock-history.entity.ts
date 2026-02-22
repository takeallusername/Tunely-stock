import { Entity, PrimaryKey, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';

@Entity({ tableName: 'stock_history' })
@Unique({ properties: ['company', 'date'] })
export class StockHistory {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Company, { deleteRule: 'cascade' })
  company!: Company;

  @Property({ type: 'date' })
  date!: Date;

  @Property()
  close!: number;

  @Property()
  open!: number;

  @Property()
  high!: number;

  @Property()
  low!: number;

  @Property({ type: 'bigint' })
  volume!: string;
}
