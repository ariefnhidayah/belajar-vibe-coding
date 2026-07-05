# Belajar Vibe Coding API

Aplikasi backend RESTful API sederhana untuk manajemen user dan autentikasi berbasis sesi (session-based authentication). Project ini dirancang dengan menggunakan teknologi modern TypeScript di ekosistem **Bun** dengan framework **ElysiaJS** dan ORM **Drizzle** yang terhubung ke database **MySQL**.

---

## Tech Stack & Library Utama

Aplikasi ini dibangun menggunakan tumpukan teknologi berikut:
- **Runtime**: [Bun](https://bun.sh/) (menawarkan eksekusi TypeScript yang sangat cepat dan runtime test bawaan).
- **Framework**: [ElysiaJS](https://elysiajs.com/) (Framework web performa tinggi yang dirancang untuk Bun dengan sistem validasi schema terintegrasi menggunakan TypeBox).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (TypeScript ORM yang aman, ringan, dan cepat).
- **Database**: [MySQL](https://www.mysql.com/) (menggunakan driver `mysql2` untuk koneksi non-blocking).
- **Library Autentikasi & Keamanan**:
  - Hashing password menggunakan Bun native password hashing utility (`bcrypt`).
  - Hashing token sesi menggunakan algoritma `SHA-256` dari modul bawaan `crypto`.

---

## Arsitektur Folder & Penamaan Berkas

Proyek ini menerapkan struktur arsitektur berlapis (*layered architecture*) yang memisahkan tanggung jawab antara definisi rute, logika bisnis, dan interaksi database.

```text
├── drizzle/                # File migrasi database yang digenerate oleh Drizzle Kit
├── src/
│   ├── db/
│   │   └── index.ts        # Inisialisasi koneksi database menggunakan Drizzle ORM
│   ├── models/
│   │   └── user-model.ts   # Definisi schema tabel Drizzle (users & sessions)
│   ├── repositories/
│   │   ├── user-repository.ts    # Abstraksi kueri database untuk tabel users
│   │   └── session-repository.ts # Abstraksi kueri database untuk tabel sessions
│   ├── services/
│   │   └── user-services.ts      # Lapisan logika bisnis (registrasi, login, profil, logout)
│   ├── routes/
│   │   └── user-routes.ts        # Definisi route ElysiaJS dan schema validasi payload
│   └── index.ts            # Entry point aplikasi, inisialisasi server, dan global error handler
├── tests/
│   └── user.test.ts        # Unit testing komprehensif menggunakan Bun test
├── .env.example            # Template berkas environment variables
├── drizzle.config.ts       # Konfigurasi Drizzle Kit untuk manajemen migrasi
├── package.json            # Konfigurasi paket dependencies dan scripts
└── tsconfig.json           # Konfigurasi TypeScript compiler
```

### Konvensi Penamaan:
- **Folders**: Menggunakan huruf kecil (`src`, `db`, `models`, `repositories`, `services`, `routes`, `tests`).
- **Files**: Menggunakan kebab-case (`user-model.ts`, `user-repository.ts`, `user-services.ts`, `user-routes.ts`, `user.test.ts`).

---

## Skema Database

Aplikasi ini menggunakan dua tabel utama di database MySQL:

### 1. Tabel `users`
Tabel untuk menampung data kredensial akun pengguna.
- `id` (int, Primary Key, Auto Increment)
- `name` (varchar(255), Not Null): Nama lengkap user (panjang maks. 255 karakter).
- `email` (varchar(255), Unique, Not Null): Alamat email unik untuk registrasi/login.
- `password` (varchar(255), Not Null): Hash password pengguna menggunakan `bcrypt`.
- `created_at` (timestamp, Default: NOW(), Not Null)
- `updated_at` (timestamp, Default: NOW(), On Update: NOW(), Not Null)

### 2. Tabel `sessions`
Tabel penampung token session aktif untuk autentikasi bertipe *database-backed session*.
- `id` (int, Primary Key, Auto Increment)
- `token` (varchar(255), Not Null): Hash `SHA-256` dari token UUID session yang asli (untuk keamanan apabila database bocor).
- `user_id` (int, Foreign Key ke `users.id` dengan relasi `ON DELETE CASCADE`): Menandakan pemilik session tersebut.
- `created_at` (timestamp, Default: NOW(), Not Null)

*Catatan: Sesi dideklarasikan aktif selama maksimal **7 hari**. Sesi yang kedaluwarsa akan dibersihkan saat verifikasi dijalankan.*

---

## Endpoint API yang Tersedia

Seluruh endpoint API memiliki prefix `/api` dan validasi input yang ketat:

### 1. Registrasi User
- **Endpoint**: `POST /api/users`
- **Body Request**:
  ```json
  {
    "name": "Nama User (max 255)",
    "email": "user@example.com (max 255, format email valid)",
    "password": "password123 (min 8, max 72)"
  }
  ```
- **Respons Sukses (201 Created)**: Mengembalikan ID, nama, dan email user yang terdaftar tanpa password hash.

### 2. Login User
- **Endpoint**: `POST /api/login`
- **Body Request**:
  ```json
  {
    "email": "user@example.com (max 255, format email valid)",
    "password": "password123 (min 8, max 72)"
  }
  ```
- **Respons Sukses (200 OK)**:
  ```json
  {
    "access_token": "random-uuid-token-string"
  }
  ```

### 3. Profil User
- **Endpoint**: `GET /api/users/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Respons Sukses (200 OK)**: Mengembalikan data profil user berdasarkan session token yang valid.

### 4. Logout User
- **Endpoint**: `DELETE /api/logout`
- **Headers**: `Authorization: Bearer <access_token>`
- **Respons Sukses (200 OK)**:
  ```json
  {
    "data": "OK"
  }
  ```
  *(Menghapus session token tersebut dari tabel database `sessions`)*

---

## Cara Setup Project

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- [Bun](https://bun.sh/) (versi $\ge 1.0$)
- [MySQL Database Server](https://www.mysql.com/)

### 2. Instalasi
1. Clone repositori ini ke komputer lokal Anda.
2. Buka direktori proyek dan instal dependensi menggunakan Bun:
   ```bash
   bun install
   ```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan nilainya dengan konfigurasi database MySQL lokal Anda, contoh:
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=password_kamu
DATABASE_NAME=belajar_vibe_coding
```

### 4. Migrasi Database
Untuk membuat tabel `users` dan `sessions` secara otomatis ke database Anda, jalankan perintah sinkronisasi skema Drizzle berikut:
```bash
bunx drizzle-kit push
```

---

## Menjalankan Aplikasi & Unit Testing

### 1. Menjalankan Server di Local Development
Jalankan perintah berikut untuk menyalakan server ElysiaJS dengan fitur *auto-reload* (*watch mode*):
```bash
bun run dev
```
Server akan berjalan di `http://localhost:3000`.

### 2. Menjalankan Unit Testing
Aplikasi ini sudah dilengkapi dengan unit test menyeluruh untuk memastikan semua endpoint API berfungsi normal di bawah skenario sukses dan gagal (uji validasi payload).

Jalankan pengujian menggunakan test runner bawaan Bun:
```bash
bun test
```
*Catatan: Tes unit akan otomatis mengosongkan tabel database `users` dan `sessions` sebelum setiap pengujian agar state tetap bersih dan konsisten.*
