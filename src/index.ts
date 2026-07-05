import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia()
  .get("/", () => ({ message: "ElysiaJS + Drizzle + MySQL API" }))

  // GET /users - list all users
  .get("/users", async () => {
    const allUsers = await db.select().from(users);
    return allUsers;
  })

  // GET /users/:id - get user by id
  .get("/users/:id", async ({ params, set }) => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(params.id)));

    if (result.length === 0) {
      set.status = 404;
      return { error: "User not found" };
    }

    return result[0];
  })

  // POST /users - create new user
  .post(
    "/users",
    async ({ body, set }) => {
      const result = await db.insert(users).values({
        name: body.name,
        email: body.email,
      });

      set.status = 201;
      return { id: Number(result[0].insertId), name: body.name, email: body.email };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )

  // PUT /users/:id - update user
  .put(
    "/users/:id",
    async ({ params, body, set }) => {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(params.id)));

      if (existing.length === 0) {
        set.status = 404;
        return { error: "User not found" };
      }

      await db
        .update(users)
        .set({ name: body.name, email: body.email })
        .where(eq(users.id, Number(params.id)));

      return { id: Number(params.id), name: body.name, email: body.email };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )

  // DELETE /users/:id - delete user
  .delete("/users/:id", async ({ params, set }) => {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(params.id)));

    if (existing.length === 0) {
      set.status = 404;
      return { error: "User not found" };
    }

    await db.delete(users).where(eq(users.id, Number(params.id)));

    return { message: "User deleted" };
  })

  .listen(3000);

console.log(`🦊 ElysiaJS server running at http://${app.server?.hostname}:${app.server?.port}`);
