import { Module } from '@nestjs/common';
import { DartService } from './dart.service';

@Module({
  providers: [DartService],
  exports: [DartService],
})
export class DartModule {}
