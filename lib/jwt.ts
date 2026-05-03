import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export function signToken(userId: string): string {
  return jwt.sign({ userId, iat: Date.now() }, JWT_SECRET, {
    expiresIn: '24h',
  });
}

export function verifyToken(token: string): {userId: string} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {userId: string};
    return decoded;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
}
