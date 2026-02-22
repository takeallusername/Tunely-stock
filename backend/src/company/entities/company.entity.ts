import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Financial } from '../../financial/entities/financial.entity';
import { StockData } from '../../stock/entities/stock-data.entity';
import { StockHistory } from '../../stock/entities/stock-history.entity';

@Entity({ tableName: 'companies' })
export class Company {
  @PrimaryKey()
  id!: number;

  @Property({ length: 36 })
  userId!: string;

  @Property({ length: 8 })
  corpCode!: string;

  @Property({ length: 100 })
  corpName!: string;

  @Property({ length: 6, nullable: true })
  stockCode?: string;

  @Property()
  createdAt: Date = new Date();

  @OneToMany(() => Financial, (financial) => financial.company)
  financials = new Collection<Financial>(this);

  @OneToMany(() => StockData, (stockData) => stockData.company)
  stockData = new Collection<StockData>(this);

  @OneToMany(() => StockHistory, (stockHistory) => stockHistory.company)
  stockHistory = new Collection<StockHistory>(this);
}
