import { Elysia, t } from "elysia";
import { UserService } from "../services/user-services";

const userService = new UserService();

export const userRoutes = new Elysia({ prefix: "/api" })
  
  // Registration Route: POST /api/users
  .post(
    "/users",
    /**
     * Handler untuk pendaftaran user baru.
     * Menerima payload body dengan validasi schema ketat, lalu memanggil service registrasi.
     */
    async ({ body, set }) => {
      const result = await userService.register(body);
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        name: t.String({ maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 8, maxLength: 72 }),
      }),
    }
  )

  // Login Route: POST /api/login
  .post(
    "/login",
    /**
     * Handler untuk autentikasi login pengguna.
     * Memverifikasi kredensial dan mengembalikan UUID token session aktif.
     */
    async ({ body, set }) => {
      const result = await userService.login(body);
      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 8, maxLength: 72 }),
      }),
    }
  )

  // Profile Route: GET /api/users/me
  /**
   * Handler untuk mengambil data profil milik pengguna yang sedang login.
   * Memerlukan Authorization token Bearer yang valid.
   */
  .get("/users/me", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid or expired session");
    }

    const token = authHeader.split(" ")[1]!;
    const session = await userService.verifySession(token);
    const profile = await userService.getProfile(Number(session.userId));
    
    set.status = 200;
    return profile;
  })

  // Logout Route: DELETE /api/logout
  /**
   * Handler untuk mengeluarkan pengguna (logout).
   * Memvalidasi token dan menghapus data session tersebut dari database sessions.
   */
  .delete("/logout", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid or expired token");
    }

    const token = authHeader.split(" ")[1]!;
    await userService.logout(token);

    set.status = 200;
    return { data: "OK" };
  });
