import {
  guard, json, readBody, supabase, verifyPassword, signToken, publicUser,
  validateCredentials
} from '../_auth.js';

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method tidak diizinkan' });

  const { username, password } = readBody(req);
  const invalid = validateCredentials(username, password);
  if (invalid) return json(res, 400, { success: false, error: invalid });

  const cleanUsername = String(username).trim().toLowerCase();

  try {
    const rows = await supabase(
      `accounts?username=eq.${encodeURIComponent(cleanUsername)}&select=id,username,display_name,password_hash,avatar_data&limit=1`
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return json(res, 401, { success: false, error: 'Username atau password salah' });
    if (!verifyPassword(password, row.password_hash)) {
      return json(res, 401, { success: false, error: 'Username atau password salah' });
    }

    const user = publicUser(row);
    return json(res, 200, { success: true, token: signToken(user), user });
  } catch (err) {
    console.error('[auth/login]', err);
    return json(res, err.status || 500, { success: false, error: 'Gagal masuk. Coba lagi.' });
  }
}
