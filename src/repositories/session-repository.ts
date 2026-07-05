import { db } from "../db";
import { sessions } from "../models/user-model";
import { eq } from "drizzle-orm";

export class SessionRepository {
  async create(session: typeof sessions.$inferInsert) {
    const result = await db.insert(sessions).values(session);
    return result[0].insertId;
  }

  async findByToken(token: string) {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);
    return result[0] || null;
  }

  async deleteByToken(token: string) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
}
