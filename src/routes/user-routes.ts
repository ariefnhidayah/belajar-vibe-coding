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
        name: t.String({ maxLength: 255, error: "Nama wajib diisi" }),
        email: t.String({ format: "email", maxLength: 255, error: "Email tidak valid" }),
        password: t.String({ minLength: 8, maxLength: 72, error: "Password minimal 8 karakter" }),
      }),
      detail: {
        summary: "Registrasi User Baru",
        description: "Mendaftarkan user baru ke sistem dengan name, email, dan password.",
        tags: ["Authentication"],
      }
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
        email: t.String({ format: "email", maxLength: 255, error: "Format email salah" }),
        password: t.String({ minLength: 8, maxLength: 72, error: "Password minimal 8 karakter" }),
      }),
      detail: {
        summary: "Login User",
        description: "Melakukan autentikasi email & password dan menghasilkan session token.",
        tags: ["Authentication"],
      }
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

    const token = authHeader.substring(7);
    const session = await userService.verifySession(token);
    const profile = await userService.getProfile(Number(session.userId));
    
    set.status = 200;
    return profile;
  }, {
    headers: t.Object({
      authorization: t.String({
        description: "Format: Bearer <session_token>",
        default: "Bearer ",
      }),
    }),
    detail: {
      summary: "Ambil Profil User",
      description: "Mendapatkan data profil user yang sedang aktif berdasarkan authorization header.",
      tags: ["User Profile"],
    }
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

    const token = authHeader.substring(7);
    await userService.logout(token);

    set.status = 200;
    return { data: "OK" };
  }, {
    headers: t.Object({
      authorization: t.String({
        description: "Format: Bearer <session_token>",
        default: "Bearer ",
      }),
    }),
    detail: {
      summary: "Logout User",
      description: "Menghapus token session aktif dari database untuk mengeluarkan user.",
      tags: ["Authentication"],
    }
  });
