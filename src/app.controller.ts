import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { AppService } from './app.service';
import { ArtistService } from './bot/services/artist.service';
import { Artist } from './bot/entities/artist.entity';
import configuration from '../src/config';
import { InjectBot } from 'nestjs-telegraf';

@Controller()
export class AppController {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly appService: AppService,
    private readonly artistService: ArtistService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/artist/:name') async findByName(
    @Param('name') name: string,
  ): Promise<Artist> {
    const artistName = name.toLocaleLowerCase();
    const message = `*From the site:* \n\n ${name}`;
    try {
      const result = await this.artistService.findOne(artistName);

      await this.bot.telegram.sendMessage(
        configuration.chat_for_all_logs,
        message,
        {
          parse_mode: 'Markdown',
        },
      );

      if (!result) {
        await this.bot.telegram.sendMessage(
          configuration.chat_for_unknow_artists,
          message,
          {
            parse_mode: 'Markdown',
          },
        );
      }

      return result;
    } catch (error) {
      console.error(error);
    }
  }
}
