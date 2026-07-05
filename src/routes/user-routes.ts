import { Elysia, t } from "elysia";
import { UserService } from "../services/user-services";

const userService = new UserService();

export const userRoutes = new Elysia({ prefix: "/api" })
  
  // Registration Route: POST /api/users
  .post(
    "/users",
    async ({ body, set }) => {
      const result = await userService.register(body);
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )

  // Login Route: POST /api/login
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await userService.login(body);
      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )

  // Profile Route: GET /api/users/me
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
