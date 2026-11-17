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
`src/apiClient.js` belum di-import oleh `src/main.js`, jadi koneksi Supabase/PostgREST
**belum dipakai game saat ini** (game masih jalan P2P via PeerJS). Berkas ini disiapkan
lebih dulu sesuai permintaan; penyambungan client-nya menyusul.

## Deploy status
- Project Vercel: `teras` (team `teras4`), project ID `prj_VfRc0AEzi5SECgNY9JciKqtU6QOd`
-
