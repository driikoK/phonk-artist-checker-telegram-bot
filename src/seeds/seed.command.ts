import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { Artist } from '../bot/entities/artist.entity';
import { User } from '../bot/entities/user.entity';
import { ArtistService } from '../bot/services/artist.service';
import { UserService } from '../bot/services/user.service';
import { users } from './datas/users.data';
import { artists } from './datas/artists.data';
import AppDataSource from '@root/../db/config/migration';

@Injectable()
export class SeedCommand {
  constructor(
    private readonly artistService: ArtistService,
    private readonly userService: UserService,
  ) {}

  @Command({
    command: 'seed:users',
    describe: 'create users',
  })
  async users() {
    for (const user of users) {
      const userTemplate = Object.assign(new User(), user);
      await this.userService.create(userTemplate);
    }
  }

  @Command({
    command: 'seed:artists',
    describe: 'create artists',
  })
  async artists() {
    for (const artist of artists) {
      const artistTemplate = Object.assign(new Artist(), artist);
      await this.artistService.create(artistTemplate);
    }
  }

  @Command({
    command: 'seed:clear',
    describe: 'create a lists',
  })
  async clear() {
    await AppDataSource.initialize();

    await AppDataSource.query(`TRUNCATE TABLE "user" CASCADE`);
    await AppDataSource.query(`TRUNCATE TABLE "artist" CASCADE`);

    await AppDataSource.destroy();
  }

  @Command({
    command: 'seed:init',
    describe: 'create a lists',
  })
  async init() {
    await this.users();
    await this.artists();
  }
}
