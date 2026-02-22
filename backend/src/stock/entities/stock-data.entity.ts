import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Company } from '../../company/entities/company.entity';

@Entity({ tableName: 'stock_data' })
export class StockData {
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

  @Property()
  collectedAt: Date = new Date();
}
