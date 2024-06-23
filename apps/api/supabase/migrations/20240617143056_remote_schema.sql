create type "public"."account_type" as enum ('depository', 'credit', 'other_asset', 'loan', 'other_liability');

alter table "public"."bank_accounts" add column "type" account_type;


