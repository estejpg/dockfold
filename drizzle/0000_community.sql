CREATE TABLE "icon_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"path" text NOT NULL,
	"source" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"width" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "icon_submissions_path_unique" UNIQUE("path"),
	CONSTRAINT "icon_status" CHECK ("icon_submissions"."status" in ('pending','approved','declined'))
);
--> statement-breakpoint
CREATE TABLE "published_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"website" text NOT NULL,
	"icon_path" text NOT NULL,
	"icon_version" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_apps_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "app_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"match_key" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"merged_into" uuid,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_requests_match_key_unique" UNIQUE("match_key"),
	CONSTRAINT "request_status" CHECK ("app_requests"."status" in ('pending','open','included','declined','merged')),
	CONSTRAINT "request_name_length" CHECK (length("app_requests"."name") between 1 and 80),
	CONSTRAINT "request_website_length" CHECK (length("app_requests"."website") between 1 and 500),
	CONSTRAINT "request_notes_length" CHECK (length("app_requests"."notes") <= 1000)
);
--> statement-breakpoint
CREATE TABLE "app_votes" (
	"request_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "app_votes_request_id_user_id_pk" PRIMARY KEY("request_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "write_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "icon_submissions" ADD CONSTRAINT "icon_submissions_request_id_app_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."app_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_apps" ADD CONSTRAINT "published_apps_request_id_app_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."app_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_votes" ADD CONSTRAINT "app_votes_request_id_app_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."app_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "icons_request" ON "icon_submissions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "requests_status_created" ON "app_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "votes_user" ON "app_votes" USING btree ("user_id");