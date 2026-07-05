import { Elysia } from "elysia";
import { userRoutes } from "./routes/user-routes";

const app = new Elysia()
  .get("/", () => ({ message: "ElysiaJS + Drizzle + MySQL API" }))
  .use(userRoutes)
  .listen(3000);

console.log(`🦊 ElysiaJS server running at http://${app.server?.hostname}:${app.server?.port}`);
