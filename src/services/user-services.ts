import { UserRepository } from "../repositories/user-repository";
import { SessionRepository } from "../repositories/session-repository";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class UserService {
  private readonly userRepo = new UserRepository();
  private readonly sessionRepo = new SessionRepository();

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

  async logout(token: string) {
    const hashedToken = hashToken(token);
    const session = await this.sessionRepo.findByToken(hashedToken);
    if (!session) {
      throw new Error("Invalid or expired token");
    }
    await this.sessionRepo.deleteByToken(hashedToken);
  }
}
