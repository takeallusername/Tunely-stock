import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
  Unique,
} from '@mikro-orm/core';
import { Financial } from '../../financial/entities/financial.entity';
import { StockData } from '../../stock/entities/stock-data.entity';
import { StockHistory } from '../../stock/entities/stock-history.entity';
import { UserCompany } from '../../user-company/entities/user-company.entity';

@Entity({ tableName: 'companies' })
@Unique({ properties: ['corpCode'] })
export class Company {
  @PrimaryKey()
  id!: number;

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

  @OneToMany(() => UserCompany, (userCompany) => userCompany.company)
  userCompanies = new Collection<UserCompany>(this);
}
