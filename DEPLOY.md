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

## Deploy status (selesai)
- Supabase: ref `fdurzejhqculuwvyluuw` (region Tokyo), schema `deploy/supabase_schema.sql`
  sudah dijalankan → tabel `accounts`, `rooms`, `room_players`, view `public_rooms`.
- Vercel: project `teras` (team `teras4`), ID `prj_VfRc0AEzi5SECgNY9JciKqtU6QOd`.
- Production URL: https://teras-2nj6nsil3-teras4.vercel.app
- Deployment: `dpl_DXrRV427XfVSkiVudKHwmfHZFSpv` — **READY**.
- Environment variables terpasang: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_DB_LOCAL_URL`, `VITE_YAPI_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- SSO/deployment protection dimatikan agar situs bisa diakses publik.
