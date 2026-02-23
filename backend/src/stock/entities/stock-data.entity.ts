import { Entity, PrimaryKey, Property, ManyToOne, OptionalProps } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';
import { StockDataRepository } from '../repositories/stock-data.repository';

@Entity({ tableName: 'stock_data', repository: () => StockDataRepository })
export class StockData {
  [OptionalProps]?: 'collectedAt';

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Company, { deleteRule: 'cascade' })
  company!: Company;

  @Property({ nullable: true })
  price?: number;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  per?: string;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pbr?: string;

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  foreignRatio?: string;

  @Property({ onCreate: () => new Date() })
  collectedAt!: Date;
}
