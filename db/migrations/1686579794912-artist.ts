import { MigrationInterface, QueryRunner } from 'typeorm';

export class artist1686579794912 implements MigrationInterface {
  name = 'artist1686579794912';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "artist" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "nationality" character varying NOT NULL, CONSTRAINT "PK_55b76e71568b5db4d01d3e394ed" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "artist"`);
  }
}
