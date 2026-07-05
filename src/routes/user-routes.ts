import { Elysia, t } from "elysia";
import { UnauthorizedError } from "../errors";
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
      response: {
        201: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
        }),
        400: t.Object({
          error: t.String(),
          details: t.Optional(
            t.Array(
              t.Object({
                field: t.String(),
                message: t.String(),
              })
            )
          ),
        }),
      },
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
      response: {
        200: t.Object({
          access_token: t.String(),
        }),
        400: t.Object({
          error: t.String(),
          details: t.Optional(
            t.Array(
              t.Object({
                field: t.String(),
                message: t.String(),
              })
            )
          ),
        }),
        401: t.Object({
          error: t.String(),
        }),
      },
      detail: {
        summary: "Login User",
        description: "Melakukan autentikasi email & password dan menghasilkan session token.",
        tags: ["Authentication"],
      }
    }
  )

  .derive(async ({ headers }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      return { user: null };
    }
    const token = authHeader.substring(7);
    try {
      const session = await userService.verifySession(token);
      return { user: { id: Number(session.userId), token } };
    } catch {
      return { user: null };
    }
  })
  // Profile Route: GET /api/users/me
  /**
   * Handler untuk mengambil data profil milik pengguna yang sedang login.
   * Memerlukan Authorization token Bearer yang valid.
   */
  .get("/users/me", async ({ user, set }) => {
    if (!user) {
      throw new UnauthorizedError("Invalid or expired session");
    }

    const profile = await userService.getProfile(user.id);
    
    set.status = 200;
    return profile;
  }, {
    response: {
      200: t.Object({
        id: t.Number(),
        name: t.String(),
        email: t.String(),
      }),
      401: t.Object({
        error: t.String(),
      }),
    },
    detail: {
      summary: "Ambil Profil User",
      description: "Mendapatkan data profil user yang sedang aktif berdasarkan authorization header.",
      tags: ["User Profile"],
      security: [{ bearerAuth: [] }],
    }
  })

  // Logout Route: DELETE /api/logout
  /**
   * Handler untuk mengeluarkan pengguna (logout).
   * Memvalidasi token dan menghapus data session tersebut dari database sessions.
   */
  .delete("/logout", async ({ user, set }) => {
    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    await userService.logout(user.token);

    set.status = 200;
    return { data: "OK" };
  }, {
    response: {
      200: t.Object({
        data: t.String(),
      }),
      401: t.Object({
        error: t.String(),
      }),
    },
    detail: {
      summary: "Logout User",
      description: "Menghapus token session aktif dari database untuk mengeluarkan user.",
      tags: ["Authentication"],
      security: [{ bearerAuth: [] }],
    }
  });
