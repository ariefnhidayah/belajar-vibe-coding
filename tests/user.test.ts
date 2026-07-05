import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/models/user-model";

const BASE_URL = "http://localhost:3000";

const validUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

describe("API Unit Tests", () => {
  beforeEach(async () => {
    // Bersihkan database sebelum setiap test agar konsisten
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("1. POST /api/users (Registrasi)", () => {
    it("harus berhasil registrasi dengan payload valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.email).toBe(validUser.email);
      expect(data.name).toBe(validUser.name);
      expect(data.password).toBeUndefined(); // Password hash jangan sampai bocor
    });

    it("harus gagal registrasi jika email kosong atau invalid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...validUser, email: "invalid-email" }),
        })
      );
      expect(response.status).toBe(400);
    });

    it("harus gagal registrasi jika password kurang dari 8 karakter", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...validUser, password: "short" }),
        })
      );
      expect(response.status).toBe(400);
    });

    it("harus gagal jika email sudah terdaftar (duplikasi)", async () => {
      // Registrasi pertama
      await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
      // Registrasi kedua dengan email yang sama
      const duplicateRes = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
      expect(duplicateRes.status).toBe(400);
      const errData = await duplicateRes.json();
      expect(errData.error).toBe("Email already exists");
    });
  });

  describe("2. POST /api/login (Login)", () => {
    beforeEach(async () => {
      // Siapkan data user valid untuk keperluan test login
      await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
    });

    it("harus berhasil login dengan kredensial valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validUser.email, password: validUser.password }),
        })
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.access_token).toBeDefined();
    });

    it("harus gagal login jika email tidak terdaftar", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "notfound@example.com", password: "password123" }),
        })
      );
      expect(response.status).toBe(401);
    });

    it("harus gagal login jika password salah", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validUser.email, password: "wrongpassword" }),
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe("3. GET /api/users/me (Profil)", () => {
    let token = "";
    beforeEach(async () => {
      await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
      const loginRes = await app.handle(
        new Request(`${BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validUser.email, password: validUser.password }),
        })
      );
      const data = await loginRes.json();
      token = data.access_token;
    });

    it("harus berhasil mendapatkan profil dengan token yang valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(response.status).toBe(200);
      const profile = await response.json();
      expect(profile.email).toBe(validUser.email);
    });

    it("harus gagal mendapatkan profil jika tanpa header authorization", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/users/me`));
      expect(response.status).toBe(401); // Diharapkan 401 sesuai custom error
    });

    it("harus gagal mendapatkan profil jika token tidak valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer invalid_token_abc` },
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe("4. DELETE /api/logout", () => {
    let token = "";
    beforeEach(async () => {
      await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validUser),
        })
      );
      const loginRes = await app.handle(
        new Request(`${BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: validUser.email, password: validUser.password }),
        })
      );
      token = (await loginRes.json()).access_token;
    });

    it("harus berhasil logout dengan token valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/logout`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(response.status).toBe(200);
      
      // Memastikan session sudah tidak bisa dipakai untuk akses profil
      const profileRes = await app.handle(
        new Request(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(profileRes.status).toBe(401);
    });
  });

  describe("5. Endpoint Root & 404", () => {
    it("harus mengembalikan info server pada route root (GET /)", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/`));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("ElysiaJS + Drizzle + MySQL API");
    });

    it("harus mengembalikan 404 untuk route yang tidak ada", async () => {
      const response = await app.handle(new Request(`${BASE_URL}/api/not-found-route`));
      expect(response.status).toBe(404);
    });
  });
});
