import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { UserCompany } from '../user-company/entities/user-company.entity';
import { Financial } from '../financial/entities/financial.entity';
import { StockData } from '../stock/entities/stock-data.entity';
import { StockHistory } from '../stock/entities/stock-history.entity';
import { DartModule } from '../dart/dart.module';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Company,
      UserCompany,
      Financial,
      StockData,
      StockHistory,
    ]),
    DartModule,
    CrawlerModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
