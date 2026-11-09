alter table "public"."profiles" add column if not exists "phone" text;--> statement-breakpoint
alter table "public"."profiles" add column if not exists "tariff_per_unit" numeric;
