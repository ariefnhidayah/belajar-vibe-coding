import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { UserService } from "../services/user-services";

const userService = new UserService();

export const userRoutes = new Elysia({ prefix: "/api" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback-secret-key",
    })
  )
  
  // Registration Route: POST /api/users
  .post(
    "/users",
    async ({ body, set }) => {
      try {
        const result = await userService.register(body);
        set.status = 201;
        return result;
      } catch (error: any) {
        if (error.message === "Email already exists") {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
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
    async ({ body, jwt, set }) => {
      try {
        const result = await userService.login(body, jwt.sign);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error.message === "Invalid email or password") {
          set.status = 401;
          return { error: error.message };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )

  // Profile Route: GET /api/users/me
  .get("/users/me", async ({ headers, jwt, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Invalid or expired access token" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload) {
        set.status = 401;
        return { error: "Invalid or expired access token" };
      }

      const userId = (payload as any).id;
      const profile = await userService.getProfile(Number(userId));
      
      set.status = 200;
      return profile;
    } catch (error: any) {
      console.error("Profile route error:", error);
      set.status = 401;
      return { error: "Invalid or expired access token" };
    }
  });
