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
    await ctx.reply(
      `*Щоб дізнатися, чи виконавець кацап, введіть його ім'я.* \n\n🛠 Додаткові  функції:\n\n/statistic — дізнатися статистику.`,
      {
        parse_mode: 'Markdown',
      },
    );
  }

  @Command('statistic')
  async statisticCommand(ctx: Context) {
    try {
      const users = await this.userService.findAll();
      const artists = await this.artistService.findAll();

      await ctx.reply(
        `👤 Кількість користувачів:  ${users.length};\n\n👩‍🎤 Кількість виконавців у базі даних:  ${artists.length};\n\n💌 Зв'язок із розробником: @Driyko`,
      );
    } catch (error) {
      console.error(error);
      await ctx.reply('Сервер не працює 😔');
      await this.errorHandling.logAndPinError(
        `Помилка з базою даних: ${error}`,
      );
    }
  }

  @Command('sendMessage')
  async sendMessage(@Ctx() ctx: Context) {
    try {
      if (ctx.message.from.id == parseInt(configuration.admin_id)) {
        if (!('reply_to_message' in ctx.message)) {
          await ctx.reply(
            'Ви не відповіли на повідомлення, що бажаєте надіслати!',
          );

          return console.log('No reply_to_message');
        }
        const replyMsg = ctx.message.reply_to_message;

        if (replyMsg) {
          const users = await this.userService.findAll();
          for (const user of users) {
            try {
              await ctx.telegram.sendCopy(user.telegram_id, replyMsg);
            } catch (error) {
              console.log(error);
              continue;
            }
          }

          await ctx.reply('Повідомлення надіслано!');
        }
      } else {
        await ctx.reply('Ви не адміністратор!');
      }
    } catch (error) {
      console.error(error);
      await ctx.reply('Сервер не працює 😔');
      await this.errorHandling.logAndPinError(`Помилка: ${error}`);
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
