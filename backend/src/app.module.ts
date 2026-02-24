import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import mikroOrmConfig from './common/config/mikro-orm.config';
import { DartModule } from './dart/dart.module';
import { CrawlerModule } from './crawler/crawler.module';
import { CompanyModule } from './company/company.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { HttpLoggingInterceptor } from './common/http-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    DartModule,
    CrawlerModule,
    CompanyModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
