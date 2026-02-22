import { Module } from '@nestjs/common';
import { NaverFinanceService } from './naver-finance.service';

@Module({
  providers: [NaverFinanceService],
  exports: [NaverFinanceService],
})
export class CrawlerModule {}
