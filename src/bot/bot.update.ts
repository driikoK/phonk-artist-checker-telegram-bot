import {
  Hears,
  InjectBot,
  Message,
  On,
  Start,
  Update,
  Help,
  Ctx,
} from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { ArtistService } from './services/artist.service';
import { UserService } from './services/user.service';
import configuration from '../../src/config';
import { User } from './entities/user.entity';

@Update()
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly artistService: ArtistService,
    private readonly userService: UserService,
  ) {}

  @Start()
  async startCommand(ctx: Context) {
    await ctx.reply(`Щоб дізнатися, чи виконавець кацап, введіть його ім'я.`);
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
  }

  @Help()
  async helpCommand(ctx: Context) {
    await ctx.reply(`Щоб дізнатися, чи виконавець кацап, введіть його ім'я.`);
  }

  @Hears('/users')
  async usersCommand(ctx: Context) {
    const users = this.userService.findAll();
    await ctx.reply(`Користувачів: ${(await users).length}`);
  }

  @On('text')
  async getMessage(@Message('text') message: string, @Ctx() ctx: Context) {
    const artist = await this.artistService.findOne(message);
    await ctx.telegram.forwardMessage(
      configuration.chat_for_all_logs,
      ctx.message.chat.id,
      ctx.message.message_id,
    );
    if (!artist) {
      await ctx.reply('Немає такого');
      await ctx.telegram.forwardMessage(
        configuration.chat_for_unknow_artists,
        ctx.message.chat.id,
        ctx.message.message_id,
      );
    } else {
      await ctx.reply(artist.nationality);
    }
  }
}
