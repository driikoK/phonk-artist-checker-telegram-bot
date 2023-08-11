import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedModule } from './seeds/seed.module';
import { BotModule } from './bot/bot.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: configuration.token,
    }),
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
    CommandModule,
    BotModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [TelegrafModule],
})
export class AppModule {}
