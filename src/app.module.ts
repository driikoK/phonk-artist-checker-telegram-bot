import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config';

@Module({
  imports: [
    BotModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: configuration.host,
      port: configuration.port,
      username: configuration.user,
      password: configuration.password,
      database: configuration.db,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
