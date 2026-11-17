ALTER TABLE "reviews" ADD COLUMN "reply_body" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reply_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reply_by" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reply_by_users_id_fk" FOREIGN KEY ("reply_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;