export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.includes('substitua-por-')) {
    throw new Error('Configure JWT_SECRET com um segredo aleatório de pelo menos 32 caracteres');
  }
  return secret;
}
