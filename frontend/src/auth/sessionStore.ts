import { restoreSession, TOKEN_KEY, USER_KEY, type Session } from './session';

function load(): Session | null {
  try {
    return restoreSession(sessionStorage.getItem(TOKEN_KEY), sessionStorage.getItem(USER_KEY));
  } catch { return null; }
}
let session = load();
const listeners = new Set<() => void>();
export const getSession = () => session;
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function clearSession() {
  try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); }
  catch { /* Mesmo com storage indisponível, encerra o estado em memória. */ }
  finally { session = null; listeners.forEach(listener => listener()); }
}
export function saveSession(value: Session) {
  const publicValue = restoreSession(value.token, JSON.stringify(value.usuario));
  if (!publicValue) throw new Error('Resposta de autenticação inválida');
  sessionStorage.setItem(TOKEN_KEY, publicValue.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(publicValue.usuario));
  session = publicValue;
  listeners.forEach(listener => listener());
}
// Descarta também pares incompletos/corrompidos deixados por uma sessão anterior.
if (!session) clearSession();
