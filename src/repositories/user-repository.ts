import { db } from "../db";
import { users } from "../models/user-model";
import { eq } from "drizzle-orm";

export class UserRepository {
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async create(user: typeof users.$inferInsert) {
    const result = await db.insert(users).values(user);
    return result[0].insertId;
  }
}
