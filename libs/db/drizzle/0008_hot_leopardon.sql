CREATE TYPE "public"."warming_message_status" AS ENUM('pending', 'sent', 'landed_inbox', 'landed_spam', 'pulled_from_spam', 'replied', 'failed');--> statement-breakpoint
CREATE TYPE "public"."warming_status" AS ENUM('off', 'ramping', 'maintenance', 'paused');--> statement-breakpoint
CREATE TABLE "warming_message" (
	"id" text PRIMARY KEY NOT NULL,
	"sender_account_id" text NOT NULL,
	"recipient_account_id" text NOT NULL,
	"warming_token" text NOT NULL,
	"subject" text NOT NULL,
	"body_preview" text,
	"gmail_message_id" text,
	"recipient_gmail_message_id" text,
	"status" "warming_message_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"landed_at" timestamp,
	"pulled_from_spam_at" timestamp,
	"replied_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warming_message_warming_token_unique" UNIQUE("warming_token")
);
--> statement-breakpoint
CREATE TABLE "warming_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"email_account_id" text NOT NULL,
	"status" "warming_status" DEFAULT 'off' NOT NULL,
	"started_at" timestamp,
	"day_number" integer DEFAULT 0 NOT NULL,
	"target_volume_today" integer DEFAULT 0 NOT NULL,
	"sent_today" integer DEFAULT 0 NOT NULL,
	"volume_reset_at" timestamp,
	"inbox_count_7d" integer DEFAULT 0 NOT NULL,
	"spam_count_7d" integer DEFAULT 0 NOT NULL,
	"reply_count_7d" integer DEFAULT 0 NOT NULL,
	"max_daily_cap" integer DEFAULT 40 NOT NULL,
	"ramp_days" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warming_schedule_email_account_id_unique" UNIQUE("email_account_id")
);
--> statement-breakpoint
ALTER TABLE "warming_message" ADD CONSTRAINT "warming_message_sender_account_id_email_account_id_fk" FOREIGN KEY ("sender_account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warming_message" ADD CONSTRAINT "warming_message_recipient_account_id_email_account_id_fk" FOREIGN KEY ("recipient_account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warming_schedule" ADD CONSTRAINT "warming_schedule_email_account_id_email_account_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "warming_message_sender_idx" ON "warming_message" USING btree ("sender_account_id");--> statement-breakpoint
CREATE INDEX "warming_message_recipient_idx" ON "warming_message" USING btree ("recipient_account_id");--> statement-breakpoint
CREATE INDEX "warming_message_status_idx" ON "warming_message" USING btree ("status");--> statement-breakpoint
CREATE INDEX "warming_message_sent_at_idx" ON "warming_message" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "warming_message_sender_recipient_idx" ON "warming_message" USING btree ("sender_account_id","recipient_account_id","sent_at");--> statement-breakpoint
CREATE INDEX "warming_schedule_status_idx" ON "warming_schedule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "warming_schedule_target_vs_sent_idx" ON "warming_schedule" USING btree ("target_volume_today","sent_today");