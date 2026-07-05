# Perencanaan Implementasi: API Logout User

Dokumen ini berisi panduan langkah-demi-langkah bagi junior programmer atau model AI untuk mengimplementasikan API **Logout User** menggunakan sistem session yang tersimpan di database.

---

## 📋 Daftar Tugas & Alur Kerja

1. [ ] **Verifikasi Session Repository**: Pastikan fungsi `deleteByToken` di `src/repositories/session-repository.ts` sudah siap digunakan.
2. [ ] **Update User Service**: Tambahkan method `logout` di `src/services/user-services.ts`.
3. [ ] **Update User Routes**: Daftarkan endpoint `DELETE /api/logout` di `src/routes/user-routes.ts`.

---

## 🛠️ Langkah-Langkah Detail Implementasi

### Langkah 1: Verifikasi `SessionRepository`
Buka file [src/repositories/session-repository.ts](file:///c:/projects/belajar-vibe-coding/src/repositories/session-repository.ts) dan pastikan method `deleteByToken` sudah didefinisikan seperti di bawah ini:

```typescript
async deleteByToken(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}
```
*Catatan:* Jika method tersebut sudah ada, Anda bisa langsung lanjut ke Langkah 2.

---

### Langkah 2: Tambahkan Method `logout` pada `UserService`
Buka [src/services/user-services.ts](file:///c:/projects/belajar-vibe-coding/src/services/user-services.ts) dan tambahkan method `logout` di dalam class `UserService`.

Method ini bertugas untuk:
1. Mencari data session di database berdasarkan token.
2. Jika session tidak ditemukan, lempar `Error` dengan pesan `"Invalid or expired token"`.
3. Jika session ditemukan, panggil repository untuk menghapusnya.

Tambahkan kode berikut ke dalam class `UserService`:

```typescript
async logout(token: string) {
  // 1. Cari token di database
  const session = await this.sessionRepo.findByToken(token);
  
  // 2. Jika tidak ditemukan, lempar error
  if (!session) {
    throw new Error("Invalid or expired token");
  }

  // 3. Jika ditemukan, hapus session dari database
  await this.sessionRepo.deleteByToken(token);
}
```

---

### Langkah 3: Daftarkan Endpoint `DELETE /logout` pada `UserRoutes`
Buka [src/routes/user-routes.ts](file:///c:/projects/belajar-vibe-coding/src/routes/user-routes.ts) dan daftarkan endpoint `DELETE /logout`. Karena `userRoutes` memiliki prefix `/api`, maka endpoint ini otomatis diakses melalui `/api/logout`.

Tambahkan kode route berikut:

```typescript
  // Logout Route: DELETE /api/logout
  .delete(
    "/logout",
    async ({ headers, set }) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader?.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Invalid or expired token" };
        }

        const token = authHeader.split(" ")[1];
        
        // Panggil service logout untuk memvalidasi dan menghapus session
        await userService.logout(token);

        set.status = 200;
        return { data: "OK" };
      } catch (error: any) {
        // Menangkap error jika token tidak valid/tidak ditemukan
        set.status = 401;
        return { error: error.message || "Invalid or expired token" };
      }
    }
  )
```

---

## 🧪 Rencana Verifikasi (Testing)

Setelah kode diimplementasikan, jalankan server (`bun run dev`) dan lakukan verifikasi dengan langkah-langkah berikut:

1. **Persiapan Token**:
   - Lakukan login terlebih dahulu melalui `POST /api/login` untuk mendapatkan `access_token` yang valid.
2. **Uji Kasus Berhasil (Success Logout)**:
   - Lakukan request `DELETE /api/logout` dengan header `Authorization: Bearer <access_token_anda>`.
   - *Verifikasi:* Response status harus `200` dengan body:
     ```json
     {
       "data": "OK"
     }
     ```
   - *Verifikasi Database:* Periksa tabel `sessions`. Baris data session dengan token tersebut harus sudah **terhapus**.
   - *Verifikasi Lanjutan:* Coba panggil endpoint `/api/users/me` menggunakan token yang baru saja di-logout tersebut. Response harus `401 Unauthorized`.

3. **Uji Kasus Gagal (Error/Invalid Token)**:
   - Lakukan request `DELETE /api/logout` menggunakan token asal atau token yang sudah dihapus sebelumnya.
   - *Verifikasi:* Response status harus `401` dengan body:
     ```json
     {
       "error": "Invalid or expired token"
     }
     ```
