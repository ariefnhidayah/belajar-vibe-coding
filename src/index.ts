import { Elysia } from "elysia";
import { userRoutes } from "./routes/user-routes";

// Validate required environment variables on startup
const requiredEnv = ["DATABASE_HOST", "DATABASE_PORT", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"];
for (const envName of requiredEnv) {
  if (process.env[envName] === undefined) {
    throw new Error(`Missing environment variable: ${envName}`);
  }
}

const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: error.message };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const badRequestErrors = ["Email already exists"];
    const unauthorizedErrors = ["Invalid email or password", "Invalid or expired token", "Invalid or expired session"];
    const notFoundErrors = ["User not found"];

    if (badRequestErrors.includes(errorMessage)) {
      set.status = 400;
      return { error: errorMessage };
    }

    if (unauthorizedErrors.includes(errorMessage)) {
      set.status = 401;
      return { error: errorMessage };
    }

    if (notFoundErrors.includes(errorMessage)) {
      set.status = 404;
      return { error: errorMessage };
    }

    // Tangkap error duplikasi MySQL (unique constraint violation)
    if ((error as any).code === "ER_DUP_ENTRY" || (error as any).errno === 1062) {
      set.status = 400;
      return { error: "Email already exists" };
    }

    console.error("Unhandled error:", error);
    set.status = 500;
    return { error: "Internal Server Error" };
  })
  .get("/", () => ({ message: "ElysiaJS + Drizzle + MySQL API" }))
  .use(userRoutes)
  .listen(3000);

console.log(`🦊 ElysiaJS server running at http://${app.server?.hostname}:${app.server?.port}`);

