import { guard, json, verifyToken, supabase, publicUser } from '../_auth.js';

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { success: false, error: 'Method tidak diizinkan' });

  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = verifyToken(token);
  if (!claims) return json(res, 401, { success: false, error: 'Sesi tidak valid' });

  try {
    const rows = await supabase(
      `accounts?id=eq.${encodeURIComponent(claims.id)}&select=id,username,display_name,avatar_data&limit=1`
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return json(res, 401, { success: false, error: 'Akun tidak ditemukan' });
    return json(res, 200, { success: true, user: publicUser(row) });
  } catch (err) {
    console.error('[auth/me]', err);
    return json(res, 500, { success: false, error: err.message || 'Gagal memeriksa sesi' });
  }
}
