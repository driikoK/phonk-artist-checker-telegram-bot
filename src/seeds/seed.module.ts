import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModule } from '../bot/bot.module';
import { Artist } from '../bot/entities/artist.entity';
import { User } from '../bot/entities/user.entity';
import { ArtistService } from '../bot/services/artist.service';
import { UserService } from '../bot/services/user.service';

@Module({
  imports: [BotModule, TypeOrmModule.forFeature([Artist, User])],
  providers: [SeedCommand, ArtistService, UserService],
})
export class SeedModule {}
