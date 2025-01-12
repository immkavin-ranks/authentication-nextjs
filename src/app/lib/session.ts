import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { SessionPayload } from "@/app/lib/definitions";
import { cookies } from "next/headers";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sessions } from "@/db/schema";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client });

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Failed to verify session: " + error);
  }
}

export async function createSession(uuid: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // 1. Create a session in the database
  const data = await db
    .insert(sessions)
    .values({
      user_id: uuid,
      expires_at: expiresAt,
    })
    // Return the session ID
    .returning({ id: sessions.id });

  const sessionId = data[0].id;

  // 2. Encrypt the session ID
  const session = await encrypt({ sessionId, expiresAt });

  // 3. Store the session in cookies for optimistic auth checks
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}