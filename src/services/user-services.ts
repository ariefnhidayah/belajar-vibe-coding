import { UserRepository } from "../repositories/user-repository";

export class UserService {
  private readonly userRepo = new UserRepository();

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

  async login(
    data: { email: string; password: string },
    jwtSign: (payload: { id: number; email: string }) => Promise<string>
  ) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await Bun.password.verify(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const accessToken = await jwtSign({
      id: user.id,
      email: user.email,
    });

    return { access_token: accessToken };
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
}
