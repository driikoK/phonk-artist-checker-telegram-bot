import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ArtistService } from './services/artist.service';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from './entities/artist.entity';
import { User } from './entities/user.entity';
import configuration from '../../src/config';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: configuration.token,
    }),
    TypeOrmModule.forFeature([Artist, User]),
  ],
  exports: [TelegrafModule, ArtistService, UserService],
  providers: [BotUpdate, ArtistService, UserService],
})
export class BotModule {}
