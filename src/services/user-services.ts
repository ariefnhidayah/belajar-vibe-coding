import { UserRepository } from "../repositories/user-repository";
import { SessionRepository } from "../repositories/session-repository";
import crypto from "node:crypto";

/**
 * Melakukan hashing SHA-256 pada token sesi mentah.
 * Digunakan untuk mengaburkan token sebelum disimpan atau dicari di database.
 * @param token Token mentah berbentuk UUID string
 * @returns Hash token dalam format hex string
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class UserService {
  private readonly userRepo = new UserRepository();
  private readonly sessionRepo = new SessionRepository();

  /**
   * Mendaftarkan pengguna baru setelah memvalidasi email unik dan melakukan hashing password.
   * @param data Payload data registrasi user (name, email, password)
   * @returns Objek user terdaftar (id, name, email)
   */
  async register(data: { name: string; email: string; password: string }) {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Use Bun's native password utility (bcrypt)
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const insertId = await this.userRepo.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    return {
      id: Number(insertId),
      name: data.name,
      email: data.email,
    };
  }

  /**
   * Memvalidasi kredensial login pengguna dan membuat token session aktif jika valid.
   * @param data Kredensial login (email, password)
   * @returns Objek berisi access_token UUID
   */
  async login(data: { email: string; password: string }) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await Bun.password.verify(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const sessionToken = crypto.randomUUID();
    const hashedToken = hashToken(sessionToken);
    
    await this.sessionRepo.create({
      token: hashedToken,
      userId: user.id,
    });

    return { access_token: sessionToken };
  }

  /**
   * Mengambil detail profil user berdasarkan ID user.
   * @param userId ID pengguna
   * @returns Objek user profile (id, name, email)
   */
  async getProfile(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  /**
   * Memverifikasi validitas token session, mengecek masa kedaluwarsanya (7 hari).
   * @param token Token mentah dari authorization header
   * @returns Objek session dari database jika valid
   */
  async verifySession(token: string) {
    const hashedToken = hashToken(token);
    const session = await this.sessionRepo.findByToken(hashedToken);
    if (!session) {
      throw new Error("Invalid or expired session");
    }

    // Check if session has expired (7 days)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - new Date(session.createdAt).getTime() > sevenDaysInMs;
    if (isExpired) {
      await this.sessionRepo.deleteByToken(hashedToken);
      throw new Error("Invalid or expired session");
    }

    return session;
  }

  /**
   * Menghapus token session aktif pengguna dari database (proses logout).
   * @param token Token mentah dari authorization header
   */
  async logout(token: string) {
    const hashedToken = hashToken(token);
    const session = await this.sessionRepo.findByToken(hashedToken);
    if (!session) {
      throw new Error("Invalid or expired token");
    }
    await this.sessionRepo.deleteByToken(hashedToken);
  }
}
