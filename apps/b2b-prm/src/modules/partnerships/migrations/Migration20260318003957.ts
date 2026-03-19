import { Migration } from '@mikro-orm/migrations';

export class Migration20260318003957 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "partner_agencies" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "agency_organization_id" uuid not null, "status" text not null default 'active', "onboarded_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "partner_agencies_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_partner_agencies_tenant_org" on "partner_agencies" ("tenant_id", "organization_id");`);
    this.addSql(`alter table "partner_agencies" add constraint "uq_partner_agencies_agency_org" unique ("tenant_id", "organization_id", "agency_organization_id");`);

    this.addSql(`create table "partner_metric_snapshots" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "partner_agency_id" uuid not null, "metric_key" text not null, "period_start" date not null, "period_end" date not null, "value" numeric(10,0) not null, "source" text not null default 'ingest', "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "partner_metric_snapshots_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_partner_metrics_tenant_org" on "partner_metric_snapshots" ("tenant_id", "organization_id");`);
    this.addSql(`alter table "partner_metric_snapshots" add constraint "uq_partner_metrics_snapshot" unique ("tenant_id", "organization_id", "partner_agency_id", "metric_key", "period_start", "period_end");`);

    this.addSql(`create table "partner_rfp_campaigns" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "title" text not null, "customer_id" uuid null, "status" text not null default 'draft', "published_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "partner_rfp_campaigns_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_partner_rfp_campaigns_tenant_org" on "partner_rfp_campaigns" ("tenant_id", "organization_id");`);

    this.addSql(`create table "partner_rfp_responses" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "rfp_campaign_id" uuid not null, "partner_agency_id" uuid not null, "status" text not null default 'invited', "score" numeric(10,0) null, "submitted_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "partner_rfp_responses_pkey" primary key ("id"));`);
    this.addSql(`alter table "partner_rfp_responses" add constraint "uq_partner_rfp_responses_agency_campaign" unique ("tenant_id", "organization_id", "rfp_campaign_id", "partner_agency_id");`);

    this.addSql(`create table "partner_tier_assignments" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "partner_agency_id" uuid not null, "tier_key" text not null, "granted_at" timestamptz not null, "valid_until" timestamptz null, "reason" text null, "assigned_by_user_id" uuid null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "partner_tier_assignments_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_partner_tier_assign_agency" on "partner_tier_assignments" ("tenant_id", "organization_id", "partner_agency_id", "valid_until");`);

    this.addSql(`create table "partner_tier_definitions" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "key" text not null, "label" text not null, "wic_threshold" int not null default 0, "wip_threshold" int not null default 0, "min_threshold" int not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, constraint "partner_tier_definitions_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_partner_tier_defs_tenant_org" on "partner_tier_definitions" ("tenant_id", "organization_id");`);
    this.addSql(`alter table "partner_tier_definitions" add constraint "uq_partner_tier_defs_key" unique ("tenant_id", "organization_id", "key");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "partner_tier_definitions" cascade;`);
    this.addSql(`drop table if exists "partner_tier_assignments" cascade;`);
    this.addSql(`drop table if exists "partner_rfp_responses" cascade;`);
    this.addSql(`drop table if exists "partner_rfp_campaigns" cascade;`);
    this.addSql(`drop table if exists "partner_metric_snapshots" cascade;`);
    this.addSql(`drop table if exists "partner_agencies" cascade;`);
  }
}
