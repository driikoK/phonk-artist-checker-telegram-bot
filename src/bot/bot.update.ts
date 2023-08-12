import {
  InjectBot,
  Message,
  On,
  Start,
  Update,
  Help,
  Ctx,
  Command,
} from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { ArtistService } from './services/artist.service';
import { UserService } from './services/user.service';
import configuration from '../../src/config';
import { User } from './entities/user.entity';
import { Artist } from './entities/artist.entity';
import { ErrorHandling } from './errors/error-handling';

@Update()
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly artistService: ArtistService,
    private readonly userService: UserService,
    private readonly errorHandling: ErrorHandling,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    await ctx.reply(`Щоб дізнатися, чи виконавець кацап, введіть його ім'я.`);
    try {
      const telegram_id = JSON.stringify(ctx.message.chat.id);
      const user = await this.userService.findOne(telegram_id);
      if (!user) {
        await this.userService.create(
          Object.assign(new User(), {
            telegram_id,
            name: ctx.message.from.first_name,
          }),
        );
      }
    } catch (error) {
      console.error(error);
      await this.errorHandling.logAndPinError(
        `Помилка з базою даних: ${error}`,
      );
    }
  }

  @Help()
  async helpCommand(ctx: Context) {
    await ctx.reply(`Щоб дізнатися, чи виконавець кацап, введіть його ім'я.`);
  }

  @Command('users')
  async usersCommand(ctx: Context) {
    try {
      const users = await this.userService.findAll();
      await ctx.reply(`Користувачів: ${users.length}`);
    } catch (error) {
      console.error(error);
      await ctx.reply('Сервер не працює 😔');
      await this.errorHandling.logAndPinError(
        `Помилка з базою даних: ${error}`,
      );
    }
  }

  @Command('addArtist')
  async addArtist(@Message('text') message: string, @Ctx() ctx: Context) {
    try {
      if (ctx.message.from.id == parseInt(configuration.admin_id)) {
        const name = message.match(/name="(.*?)"/)[1];
        const nationality = message.match(/nationality="(.*?)"/)[1];

        const artist = Object.assign(new Artist(), { name, nationality });

        await this.artistService.create(artist);

        await ctx.reply('Виконавця додано!');
      } else {
        await ctx.reply('Ви не адміністратор!');
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('Сервер не працює 😔');
      await this.errorHandling.logAndPinError(
        `Помилка з базою даних: ${error}`,
      );
    }
  }

  @Command('updateArtist')
  async updateArtist(@Message('text') message: string, @Ctx() ctx: Context) {
    try {
      if (ctx.message.from.id == parseInt(configuration.admin_id)) {
        const currentName = message.match(/name="(.*?)"/)[1];
        const newName = message.match(/new_name="(.*?)"/)?.[1] ?? null;
        const newNationality =
          message.match(/new_nationality="(.*?)"/)?.[1] ?? null;

        const artist = await this.artistService.findOne(currentName);

        if (!artist) {
          await ctx.reply('Такого виконавця немає!');
        } else {
          const updatedArtist = Object.assign(artist, {
            name: newName ?? artist.name,
            nationality: newNationality ?? artist.nationality,
          });

          await this.artistService.update(artist.id, updatedArtist);

          await ctx.reply('Виконавця оновлено!');
        }
      } else {
        await ctx.reply('Ви не адміністратор!');
      }
    } catch (error) {
      console.error(error);
      await this.errorHandling.logAndPinError(
        `Помилка з базою даних: ${error}`,
      );
    }
  }

  @On('text')
  async getMessage(@Message('text') message: string, @Ctx() ctx: Context) {
    try {
      const name = message.toLocaleLowerCase();
      const artist = await this.artistService.findOne(name);
      await ctx.telegram.forwardMessage(
        configuration.chat_for_all_logs,
        ctx.message.chat.id,
        ctx.message.message_id,
      );
      if (!artist) {
        await ctx.reply('На жаль, не відомо, або ж ви допустили помилку 😔');
        await ctx.telegram.forwardMessage(
          configuration.chat_for_unknow_artists,
          ctx.message.chat.id,
          ctx.message.message_id,
        );
      } else {
        await ctx.reply(artist.nationality);
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('Сервер не працює 😔');
      await this.errorHandling.logAndPinError(
        `Помилка з базою даних: ${error}`,
      );
    }
  }
}
