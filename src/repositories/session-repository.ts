import { db } from "../db";
import { sessions } from "../models/user-model";
import { eq } from "drizzle-orm";

export class SessionRepository {
  /**
   * Menyimpan data session baru ke database.
   * @param session Objek data session (token terenkripsi, userId)
   * @returns ID dari record session baru
   */
  async create(session: typeof sessions.$inferInsert) {
    const result = await db.insert(sessions).values(session);
    return result[0].insertId;
  }

  /**
   * Mencari data session berdasarkan token session yang sudah terenkripsi.
   * @param token Token terenkripsi (SHA-256)
   * @returns Objek session jika ditemukan, null jika tidak ditemukan
   */
  async findByToken(token: string) {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Menghapus session berdasarkan token session yang terenkripsi (proses logout).
   * @param token Token terenkripsi (SHA-256) yang akan dihapus
   */
  async deleteByToken(token: string) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
}
