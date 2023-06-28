## Configuration

    # Typical .env file

      TELEGRAM_BOT_TOKEN = your telegram bot token
      TELEGRAM_CHAT_ID_FOR_ALL_LOGS = your chat id for all logs
      TELEGRAM_CHAT_ID_FOR_UNKNOW_ARTIST_LOGS = your chat id for unknown artist logs
      TELEGRAM_ADMIN_ID = your telegram admin id

      POSTGRES_HOST = your postgres host
      POSTGRES_PORT = your postgres port
      POSTGRES_USER = your postgres user
      POSTGRES_PASSWORD = your postgres password
      POSTGRES_DB = your postgres db

## Installation

```bash
$ npm install
```

```bash
$ npm run migrate:run
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Data seeding

```bash
# run seeds
$ npm run seed

# clear seeds
$ npm run seed:clear
```

## User commands:

<div>
  <ul>
    <li>
      <b>/start</b> — greet the bot
    </li>
    <li>
      <b>/help</b> — show help message
    </li>
    <li>
      <b>/users</b> — shows amount of users
    </li>
  </ul>
</div>

## Admin commands:

 <div>
  <ul>
    <li>
      <b>/addArtist name="///", nationality="///"</b> — add artist to the db
    </li>
    <li>
       <b>/updateArtist name="///", new_name="///", new_nationality="///"</b> — update artist in the db, 'new_name' and 'new_nationality' are optional
    </li>
  </ul>
</div>
