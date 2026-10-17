import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";
export const reports=sqliteTable("reports",{token:text("token").primaryKey(),lat:real("lat").notNull(),lng:real("lng").notNull(),accuracy:real("accuracy").notNull(),updated:integer("updated").notNull(),history:text("history").notNull(),trip:text("trip").notNull().default("{}")},t=>[index("reports_updated_idx").on(t.updated)]);
export const mapUsage=sqliteTable("map_usage",{month:text("month").primaryKey(),loads:integer("loads").notNull().default(0)});

export const pilotRoutes=sqliteTable("pilot_routes",{id:text("id").primaryKey(),name:text("name").notNull(),stops:text("stops").notNull(),created:integer("created").notNull()});
