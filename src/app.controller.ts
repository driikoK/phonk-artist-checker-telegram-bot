import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { ArtistService } from './bot/services/artist.service';
import { Artist } from './bot/entities/artist.entity';

@Controller('artist')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly artistService: ArtistService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get(':name') findByName(@Param('name') name: string): Promise<Artist> {
    const artistName = name.toLocaleLowerCase();
    return this.artistService.findOne(artistName);
  }
}
