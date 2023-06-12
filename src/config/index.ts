import * as dotenv from 'dotenv';

dotenv.config();

// export enviroments
export default {
  token: process.env.TELEGRAM_BOT_TOKEN,
  chat_for_all_logs: process.env.TELEGRAM_CHAT_ID_FOR_ALL_LOGS,
  chat_for_unknow_artists: process.env.TELEGRAM_CHAT_ID_FOR_UNKNOW_ARTIST_LOGS,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  db: process.env.POSTGRES_DB,
};
