CREATE TABLE "shopping_lists" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"cart" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"saved" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wishlist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;