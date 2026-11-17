/**
 * Shared helpers for Teras account authentication (Vercel serverless functions).
 * Uses SUPABASE_SERVICE_ROLE_KEY so writes bypass RLS (anon is read-only).
 * No external dependencies — password hashing uses Node's built-in scrypt.
 */
import crypto from 'node:crypto';

export const SUPABASE_URL = (
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
).replace(/\/$/, '');

export const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

const TOKEN_SECRET = process.env.AUTH_SECRET || SERVICE_KEY;

export function json(res, status, data) {
  return res.status(status).json(data);
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hex] = String(stored).split('$');
    if (scheme !== 'scrypt' || !salt || !hex) return false;
    const expected = Buffer.from(hex, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function signToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    username: user.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  try {
    const [payload, sig] = String(token || '').split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarData: row.avatar_data || {}
  };
}

/** Small PostgREST wrapper using the service role key. */
export async function supabase(path, options = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase belum dikonfigurasi di environment Vercel');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = data && data.message ? data.message : `Supabase HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function validateCredentials(username, password) {
  const u = String(username || '').trim();
  const p = String(password || '');
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(u)) {
    return 'Username harus 3–30 karakter (huruf, angka, underscore)';
  }
  if (p.length < 6) return 'Password minimal 6 karakter';
  return null;
}

/** CORS + method guard shared by all auth endpoints. */
export function guard(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}
