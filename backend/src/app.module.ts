import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './common/config/mikro-orm.config';
import { DartModule } from './dart/dart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    DartModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
