import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractTokenFromHeader, verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    // Verify auth
    const token = extractTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get user stats
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Stats not found' },
        { status: 404 }
      );
    }

    // Get recent attempts
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, total_accuracy, skill_breakdown, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recent_attempts: attempts || [],
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
