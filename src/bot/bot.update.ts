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
import * as stringSimilarity from 'string-similarity';
import * as fs from 'fs';
import * as path from 'path';

@Update()
export class BotUpdate {
  private bannedUsers: Set<string> = new Set();
  private alertedBannedUsers: Set<string> = new Set();

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly artistService: ArtistService,
    private readonly userService: UserService,
    private readonly errorHandling: ErrorHandling,
  ) {
    this.loadBannedUsers();
  }

  private async loadBannedUsers() {
    try {
      const bannedUsers = await this.userService.findBannedUsers();
      bannedUsers.forEach((user) => this.bannedUsers.add(user.telegram_id));
      console.log('Banned users loaded:', this.bannedUsers);
    } catch (error) {
      console.error('Error loading banned users:', error);
    }
  }

  private async banUser(telegram_id: string) {
    try {
      await this.userService.banUser(telegram_id); // Update DB
      this.bannedUsers.add(telegram_id); // Update in-memory Set
    } catch (error) {
      console.error('Error banning user:', error);
    }
  }

  private async unbanUser(telegram_id: string) {
    try {
      await this.userService.unbanUser(telegram_id); // Update DB
      this.bannedUsers.delete(telegram_id); // Update in-memory Set
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  }

  @Start()
  async startCommand(ctx: Context) {
    const telegram_id = ctx.message.chat.id.toString();

    // Check if the user is banned
    if (this.bannedUsers.has(telegram_id)) {
      // Check if the user has already been alerted
      if (!this.alertedBannedUsers.has(telegram_id)) {
        await ctx.reply('Ви заблоковані'); // Alert the user
        this.alertedBannedUsers.add(telegram_id); // Mark the user as alerted
      }
      return; // Ignore further messages from banned users
    }

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
    const telegram_id = ctx.message.chat.id.toString();

    // Check if the user is banned
    if (this.bannedUsers.has(telegram_id)) {
      // Check if the user has already been alerted
      if (!this.alertedBannedUsers.has(telegram_id)) {
        await ctx.reply('Ви заблоковані'); // Alert the user
        this.alertedBannedUsers.add(telegram_id); // Mark the user as alerted
      }
      return; // Ignore further messages from banned users
    }

    await ctx.reply(
      `*Щоб дізнатися, чи виконавець кацап, введіть його ім'я.* \n\n🛠 Додаткові  функції:\n\n/statistic — дізнатися статистику.`,
      {
        parse_mode: 'Markdown',
      },
    );
  }

  @Command('users')
  async sendUserList(@Ctx() ctx: Context) {
    try {
      // Check if the user is the admin
      if (ctx.message.from.id != parseInt(configuration.admin_id)) {
        await ctx.reply('Ви не адміністратор!');
        return;
      }

      // Fetch all users from the database
      const users = await this.userService.findAll();

      if (!users.length) {
        await ctx.reply('No users found in the database.');
        return;
      }

      const sortedUsers = users.sort((a, b) => a.id - b.id);

      // Create the file content
      const fileContent = sortedUsers
        .map(
          (user) => `ID: ${user.telegram_id}, Name: ${user.name || 'Unknown'}`,
        )
        .join('\n');

      // Define the file path
      const filePath = path.resolve(__dirname, 'users.txt');

      // Write the content to the file
      fs.writeFileSync(filePath, fileContent);

      // Send the file to the admin
      await ctx.replyWithDocument({ source: filePath, filename: 'users.txt' });

      // Remove the file after sending
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error generating user list:', error);
      await ctx.reply('Failed to generate the user list.');
      await this.errorHandling.logAndPinError(
        `Error generating user list: ${error}`,
      );
    }
  }

  @Command('statistic')
  async statisticCommand(ctx: Context) {
    try {
      const telegram_id = ctx.message.chat.id.toString();

      // Check if the user is banned
      if (this.bannedUsers.has(telegram_id)) {
        // Check if the user has already been alerted
        if (!this.alertedBannedUsers.has(telegram_id)) {
          await ctx.reply('Ви заблоковані'); // Alert the user
          this.alertedBannedUsers.add(telegram_id); // Mark the user as alerted
        }
        return; // Ignore further messages from banned users
      }

      const users = await this.userService.findAll();
      const artists = await this.artistService.findAll();

      await ctx.reply(
        `👤 Кількість користувачів:  ${users.length};\n\n👩‍🎤 Кількість виконавців у базі даних:  ${artists.length};\n\n💌 Зв'язок із розробником: @Driyko \n\n💰[Монобанка](https://send.monobank.ua/jar/8qvQbTt34x) для охочих допомогти з утриманням бота.`,
        {
          parse_mode: 'Markdown',
        },
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

  @Command('ban')
  async banCommand(@Message('text') message: string, @Ctx() ctx: Context) {
    if (ctx.message.from.id !== parseInt(configuration.admin_id)) {
      await ctx.reply('Ви не адміністратор!');
      return;
    }

    const telegram_id = message.split(' ')[1]; // Example: "/ban 123456"
    if (!telegram_id) {
      await ctx.reply('Вкажіть telegram_id користувача!');
      return;
    }

    await this.banUser(telegram_id);
    await ctx.reply(`Користувача ${telegram_id} заблоковано!`);
  }

  @Command('unban')
  async unbanCommand(@Message('text') message: string, @Ctx() ctx: Context) {
    if (ctx.message.from.id !== parseInt(configuration.admin_id)) {
      await ctx.reply('Ви не адміністратор!');
      return;
    }

    const telegram_id = message.split(' ')[1]; // Example: "/unban 123456"
    if (!telegram_id) {
      await ctx.reply('Вкажіть telegram_id користувача!');
      return;
    }

    await this.unbanUser(telegram_id);
    await ctx.reply(`Користувача ${telegram_id} розблоковано!`);
  }

  @On('text')
  async getMessage(@Message('text') message: string, @Ctx() ctx: Context) {
    try {
      const telegram_id = ctx.message.chat.id.toString();

      // Check if the user is banned
      if (this.bannedUsers.has(telegram_id)) {
        // Check if the user has already been alerted
        if (!this.alertedBannedUsers.has(telegram_id)) {
          await ctx.reply('Ви заблоковані'); // Alert the user
          this.alertedBannedUsers.add(telegram_id); // Mark the user as alerted
        }
        return; // Ignore further messages from banned users
      }

      const name = message.toLocaleLowerCase();
      const artist = await this.artistService.findOne(name);
      await ctx.telegram.forwardMessage(
        configuration.chat_for_all_logs,
        ctx.message.chat.id,
        ctx.message.message_id,
      );
      if (!artist) {
        const allArtists = await this.artistService.findAll();
        const threshold = 0.5;
        const similarArtists = allArtists
          .map((a) => ({
            artist: a,
            rating: stringSimilarity.compareTwoStrings(name, a.name),
          }))
          .filter((match) => match.rating >= threshold)
          .sort((a, b) => b.rating - a.rating);

        if (similarArtists.length > 0) {
          const replyMessage = `Не знайдено 😔 Можливо, ви мали на увазі:\n\n${similarArtists
            .map((match) => `${match.artist.name}`)
            .join('\n')}`;
          const logMessage = `⬆️ Це, можливо, одрук і малось на увазі:\n\n${similarArtists
            .map((match) => `${match.artist.name}`)
            .join('\n')}`;
          await ctx.reply(replyMessage);
          await ctx.telegram.forwardMessage(
            configuration.chat_for_unknow_artists,
            ctx.message.chat.id,
            ctx.message.message_id,
          );
          await ctx.telegram.sendMessage(
            configuration.chat_for_unknow_artists,
            logMessage,
          );
        } else {
          await ctx.reply('На жаль, не відомо, або ж ви допустили помилку 😔');
          await ctx.telegram.forwardMessage(
            configuration.chat_for_unknow_artists,
            ctx.message.chat.id,
            ctx.message.message_id,
          );
        }
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
