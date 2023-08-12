import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import configuration from '../../config';

export class ErrorHandling {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async logAndPinError(errorMessage: string) {
    try {
      const message = await this.bot.telegram.sendMessage(
        configuration.chat_for_all_logs,
        errorMessage,
      );
      await this.bot.telegram.pinChatMessage(
        configuration.chat_for_all_logs,
        message.message_id,
      );
    } catch (err) {
      console.error(err);
    }
  }
}
