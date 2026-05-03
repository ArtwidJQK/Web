import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const { data, error } = await supabase
      .from('attempts')
      .select('*, exams(name, source)')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        attempts: data || [],
      },
    });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
