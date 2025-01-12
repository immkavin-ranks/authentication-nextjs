import { bigint, pgTable, text, uuid, } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  user_id: uuid().primaryKey().unique(),
});
