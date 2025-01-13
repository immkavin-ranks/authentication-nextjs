import "server-only";
import { getUser } from "@/app/lib/dal";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface User {
  id: number;
  name: string;
  email: string;
  phonenumber: string | null;
  is_admin: boolean;
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema: { users } });

function canSeeEmail() {
  return true;
}

function canSeePhoneNumber(viewer: User) {
  return viewer.is_admin;
}

export async function getProfileDTO(id: number) {
  const data = await db.query.users.findMany({
    where: eq(users.id, id),
    // Return specific columns here
    columns: {
      id: true,
      name: true,
      email: true,
      phonenumber: true,
      is_admin: true,
    }
  });
  const user = data[0];

  const currentUser = await getUser();
 
  if (!currentUser) {
    throw new Error("User not found");
  }
  // Or return only what's specific to the query here
  return {
    email: canSeeEmail() ? user.email : null,
    phonenumber: canSeePhoneNumber(currentUser)
      ? user.phonenumber
      : null,
  };
}
