import { db } from "../db";
import { users } from "../models/user-model";
import { eq } from "drizzle-orm";

export class UserRepository {
  /**
   * Mencari user berdasarkan email.
   * @param email Email user yang ingin dicari
   * @returns Objek user jika ditemukan, null jika tidak ditemukan
   */
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  /**
   * Mencari user berdasarkan ID unik.
   * @param id ID user yang ingin dicari
   * @returns Objek user jika ditemukan, null jika tidak ditemukan
   */
  async findById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * Menambahkan data user baru ke database.
   * @param user Data user yang akan dimasukkan (name, email, password)
   * @returns ID dari record user yang berhasil dimasukkan
   */
  async create(user: typeof users.$inferInsert) {
    const result = await db.insert(users).values(user);
    return result[0].insertId;
  }
}
