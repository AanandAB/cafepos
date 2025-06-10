CREATE TYPE "public"."expense_category" AS ENUM('inventory', 'salary', 'rent', 'utilities', 'equipment', 'maintenance', 'marketing', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'preparing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'upi', 'other');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('cgst_sgst', 'igst');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'staff', 'cashier');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "employee_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"clock_in" timestamp DEFAULT now() NOT NULL,
	"clock_out" timestamp
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" double precision NOT NULL,
	"category" "expense_category" DEFAULT 'other' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"user_id" integer,
	"notes" text,
	"receipt_url" text
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"alert_threshold" double precision,
	"cost" double precision
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" double precision NOT NULL,
	"category_id" integer,
	"tax_rate" double precision DEFAULT 5 NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"stock_quantity" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"menu_item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" double precision NOT NULL,
	"total_price" double precision NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer,
	"user_id" integer,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"total_amount" double precision DEFAULT 0 NOT NULL,
	"tax_amount" double precision DEFAULT 0 NOT NULL,
	"tax_type" "tax_type" DEFAULT 'cgst_sgst' NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"payment_method" "payment_method",
	"customer_name" text,
	"customer_phone" text,
	"customer_gstin" text,
	"invoice_number" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"type" text DEFAULT 'string' NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"occupied" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;