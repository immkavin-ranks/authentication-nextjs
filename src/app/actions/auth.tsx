"use server";

import { SignupFormSchema, FormState } from "@/app/lib/definitions";
import bcrypt from "bcryptjs";
import { users } from "@/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createSession, deleteSession } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client });

export async function signup(state: FormState, formData: FormData) {
  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Call the provider or db to create a user...

  // 2. Prepare data for insertion into database
  const { name, email, password } = validatedFields.data;

  // e.g. Hash the user's password before storing it
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Insert the user into the database or call an Auth Library's API
  const data = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      uuid: uuidv4(),
    })
    .returning({ uuid: users.uuid });

  const user = data[0];

  if (!user) {
    return {
      message: "An error occurred while creating your account.",
    };
  }

  // TODO:
  // 4. Create user session
  await createSession(user.uuid);

  // 5. Redirect user
  redirect("/profile");
}

export async function logout() {
  deleteSession();
  redirect("/login");
}
