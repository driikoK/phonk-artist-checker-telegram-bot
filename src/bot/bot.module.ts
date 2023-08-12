import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ArtistService } from './services/artist.service';
import { UserService } from './services/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from './entities/artist.entity';
import { User } from './entities/user.entity';
import configuration from '../../src/config';
import { ErrorHandling } from './errors/error-handling';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: configuration.token,
    }),
    TypeOrmModule.forFeature([Artist, User]),
  ],
  exports: [TelegrafModule, ArtistService, UserService, ErrorHandling],
  providers: [BotUpdate, ArtistService, UserService, ErrorHandling],
})
export class BotModule {}
