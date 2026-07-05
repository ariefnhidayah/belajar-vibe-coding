import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";
import { userRoutes } from "./routes/user-routes";

// Validate required environment variables on startup
const requiredEnv = ["DATABASE_HOST", "DATABASE_PORT", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"];
for (const envName of requiredEnv) {
  if (process.env[envName] === undefined) {
    throw new Error(`Missing environment variable: ${envName}`);
  }
}

// Inisialisasi instance ElysiaJS utama
export const app = new Elysia()
  .use(
    openapi({
      path: "/swagger",
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description: "Dokumentasi API interaktif untuk aplikasi Belajar Vibe Coding",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
            },
          },
        },
      }
    })
  )
  /**
   * Hook global error handler untuk menangkap exception di seluruh aplikasi.
   * Melakukan pemetaan error ke status code HTTP yang sesuai.
   */
  .onError(({ code, error, set }) => {
    // Menangani error validasi schema (misal: panjang karakter, tipe data tidak sesuai)
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: error.message };
    }

    // Menangani error route tidak ditemukan (404)
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found" };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const badRequestErrors = ["Email already exists"];
    const unauthorizedErrors = ["Invalid email or password", "Invalid or expired token", "Invalid or expired session"];
    const notFoundErrors = ["User not found"];

    // Menangani error Bad Request spesifik yang dilempar oleh service
    if (badRequestErrors.includes(errorMessage)) {
      set.status = 400;
      return { error: errorMessage };
    }

    // Menangani error autentikasi yang dilempar oleh service
    if (unauthorizedErrors.includes(errorMessage)) {
      set.status = 401;
      return { error: errorMessage };
    }

    // Menangani error data tidak ditemukan yang dilempar oleh service
    if (notFoundErrors.includes(errorMessage)) {
      set.status = 404;
      return { error: errorMessage };
    }

    // Tangkap error duplikasi MySQL (unique constraint violation) secara aman
    if ((error as any).code === "ER_DUP_ENTRY" || (error as any).errno === 1062) {
      set.status = 400;
      return { error: "Email already exists" };
    }

    // Logging unhandled error di server untuk proses debugging
    console.error("Unhandled error:", error);
    set.status = 500;
    return { error: "Internal Server Error" };
  })
  /**
   * Endpoint Root /
   * Mengembalikan status info server sederhana.
   */
  .get("/", () => ({ message: "ElysiaJS + Drizzle + MySQL API" }))
  // Memasang group router untuk rute-rute terkait user
  .use(userRoutes)
  .listen(3000);

console.log(`🦊 ElysiaJS server running at http://${app.server?.hostname}:${app.server?.port}`);

