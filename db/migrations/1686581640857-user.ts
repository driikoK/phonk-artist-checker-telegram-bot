import { MigrationInterface, QueryRunner } from 'typeorm';

export class user1686581640857 implements MigrationInterface {
  name = 'user1686581640857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "telegram_id" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
