import {
  guard, json, readBody, supabase, hashPassword, signToken, publicUser,
  validateCredentials
} from '../_auth.js';

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method tidak diizinkan' });

  const { username, password, displayName, avatarData } = readBody(req);
  const invalid = validateCredentials(username, password);
  if (invalid) return json(res, 400, { success: false, error: invalid });

  const cleanUsername = String(username).trim().toLowerCase();
  const name = String(displayName || cleanUsername).trim().slice(0, 50) || cleanUsername;
  const avatar = avatarData && typeof avatarData === 'object' ? avatarData : {};

  try {
    const existing = await supabase(
      `accounts?username=eq.${encodeURIComponent(cleanUsername)}&select=id&limit=1`
    );
    if (Array.isArray(existing) && existing.length) {
      return json(res, 409, { success: false, error: 'Username sudah dipakai. Coba yang lain.' });
    }

    const rows = await supabase('accounts', {
      method: 'POST',
      body: {
        username: cleanUsername,
        display_name: name,
        password_hash: hashPassword(password),
        avatar_data: avatar
      }
    });

    const user = publicUser(Array.isArray(rows) ? rows[0] : rows);
    return json(res, 200, { success: true, token: signToken(user), user });
  } catch (err) {
    console.error('[auth/register]', err);
    return json(res, err.status || 500, {
      success: false,
      error: 'Gagal membuat akun. Coba lagi.'
    });
  }
}
