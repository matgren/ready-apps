import { Migration } from '@mikro-orm/migrations';

export class Migration20260402000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "tier_assignments" rename column "effective_date" to "valid_from";`);
    this.addSql(`alter table "tier_assignments" add column "valid_until" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "tier_assignments" drop column "valid_until";`);
    this.addSql(`alter table "tier_assignments" rename column "valid_from" to "effective_date";`);
  }

}
