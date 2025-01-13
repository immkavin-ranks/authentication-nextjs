import "server-only";

import { cookies } from "next/headers";
import { decrypt } from "@/app/lib/session";
import { redirect } from "next/navigation";
import { cache } from "react";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SessionPayload } from "./definitions";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema: { sessions, users } });

type VerifiedSession = {
  isAuth: true;
  sessionId: number;
  user: SessionPayload["user"];
};

export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const cookie = (await cookies()).get("session")?.value;

  const session = await decrypt(cookie);

  if (!session?.sessionId) {
    redirect("/login");
  }

  return { isAuth: true, sessionId: session.sessionId, user: session.user };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const session_data = await db.query.sessions.findMany({
      where: eq(sessions.id, Number(session.sessionId)),
      // Explicitly return the columns you need rather than the whole session object
      columns: {
        user_id: true,
      },
    });

    const user_data = await db.query.users.findMany({
      where: eq(users.id, session_data[0].user_id!),
      // Explicitly return the columns you need rather than the whole user object
      columns: {
        id: true,
        name: true,
        email: true,
        phonenumber: true,
        is_admin: true,
      },
    });

    const user = user_data[0];

    return user;
  } catch (error) {
    console.log("Failed to fetch user: " + error);
    return null;
  }
});
