# Deploy Teras — Supabase + Vercel

## Status sekarang
- Repo GitHub: https://github.com/yaha2204/teras (branch `main`)
- Project Supabase sudah ada: `fdurzejhqculuwvyluuw`
  - URL: https://fdurzejhqculuwvyluuw.supabase.co
  - Org: `teras`, region Tokyo, plan Free
- Build lokal `npm run build` ✅ sukses (output `dist/`)

## 1. Supabase — pasang skema
1. Buka https://supabase.com/dashboard/project/fdurzejhqculuwvyluuw/sql
2. Klik **+ New query**
3. Copy seluruh isi `deploy/supabase_schema.sql`
4. Klik **Run** → harus muncul `Success. No rows returned`
5. Cek **Table Editor**: harus ada `accounts`, `rooms`, `room_players`

## 2. Supabase — ambil 3 nilai
**Project Settings → API**:
- `Project URL` → isi `VITE_SUPABASE_URL`
- `anon / public` → isi `VITE_SUPABASE_ANON_KEY`
- `service_role / secret` (klik Reveal) → isi `SUPABASE_SERVICE_ROLE_KEY` (Vercel env, JANGAN pakai prefix `VITE_`)

## 3. Vercel — import
1. https://vercel.com/new → **Import Git Repository** → `yaha2204/teras`
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variables: isi 4 variabel dari `.env.example` + `SUPABASE_SERVICE_ROLE_KEY`
6. Deploy

## Catatan penting
`src/apiClient.js` sekarang sudah di-import oleh `src/main.js`. Client dipakai untuk
mendaftarkan room dan menyinkronkan state (scene, musik, siren) secara fire-and-forget.
Game tetap berjalan P2P via PeerJS — kegagalan backend tidak menghentikan permainan.
Mode lokal (PostgREST) diprioritaskan, fallback ke Supabase untuk baca room publik.

## Akun wajib sebelum gabung (auth gate)
Layar **Buat Akun / Masuk** muncul saat aplikasi dibuka — user harus punya akun
dulu sebelum bisa daftar/gabung ke teras.

- Endpoint serverless: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
  (file `api/auth/*.js`, helper `api/_auth.js` — diabaikan sebagai function oleh Vercel).
- Password di-hash dengan `scrypt` + salt acak (Node `crypto`, tanpa dependency).
- Token sesi HMAC-SHA256 (30 hari) disimpan di `localStorage` (`thaloria_jwt_token`).
- Semua query tabel `accounts` memakai `SUPABASE_SERVICE_ROLE_KEY` karena RLS
  hanya mengizinkan anon **read**.
- `src/authGate.js` mengatur UI gate; `src/apiClient.js` memanggil endpoint
  same-origin `/api/auth/*` (Vercel) atau proxy Vite → backend lokal saat development.

Alur uji lokal (register duplikat → 409, password salah → 401, `/me` → 200) lolos.

## Deploy status (selesai)
- Supabase: ref `fdurzejhqculuwvyluuw` (region Tokyo), schema `deploy/supabase_schema.sql`
  sudah dijalankan → tabel `accounts`, `rooms`, `room_players`, view `public_rooms`.
- Vercel: project `teras` (team `teras4`), ID `prj_VfRc0AEzi5SECgNY9JciKqtU6QOd`.
- Production URL: https://teras-teras4.vercel.app
- Environment variables terpasang: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_DB_LOCAL_URL`, `VITE_YAPI_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- SSO/deployment protection dimatikan agar situs bisa diakses publik.

Setiap push ke `main` otomatis di-deploy oleh Vercel (git deployment aktif).
