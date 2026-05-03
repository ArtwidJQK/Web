import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/jwt';

export function requireUser(req: NextRequest):
  | { userId: string; error?: never }
  | { userId?: never; error: NextResponse } {
  const token = extractTokenFromHeader(req.headers.get('authorization') || '');

  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      ),
    };
  }

  return { userId: decoded.userId };
}
