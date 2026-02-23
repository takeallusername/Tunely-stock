import { Entity, PrimaryKey, Property, ManyToOne, Unique } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';
import { StockHistoryRepository } from '../repositories/stock-history.repository';

@Entity({ tableName: 'stock_history', repository: () => StockHistoryRepository })
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
