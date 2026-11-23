export const TOKEN_KEY = 'petcare_token';
export const USER_KEY = 'petcare_usuario';
export type UsuarioPublico = { id: number; nome: string; email: string };
export type Session = { token: string; usuario: UsuarioPublico };

export function tokenExpiresAt(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload !== 'object' || payload === null || !('exp' in payload) ||
        typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    const expires = payload.exp * 1000;
    return Number.isFinite(expires) ? expires : null;
  } catch { return null; }
}

// A assinatura é validada pela API; o cliente só verifica formato e expiração.
export function restoreSession(token: string | null, userJson: string | null, now = Date.now()): Session | null {
  if (!token || !userJson || (tokenExpiresAt(token) ?? 0) <= now) return null;
  try {
    const user: unknown = JSON.parse(userJson);
    if (typeof user !== 'object' || user === null || !('id' in user) ||
        typeof user.id !== 'number' || !Number.isInteger(user.id) || user.id <= 0 ||
        !('nome' in user) || typeof user.nome !== 'string' || !user.nome.trim() ||
        !('email' in user) || typeof user.email !== 'string' || !user.email.trim()) return null;
    return { token, usuario: { id: user.id, nome: user.nome, email: user.email } };
  } catch { return null; }
}
