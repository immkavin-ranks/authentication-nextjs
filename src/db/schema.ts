import { bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity().unique(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  uuid: uuid().primaryKey().unique(),
});

export const sessions = pgTable("sessions", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: bigint({ mode: "number" }).references(() => users.id),
  expires_at: timestamp(),
});
