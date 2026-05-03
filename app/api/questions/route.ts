import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { shuffle } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skill = searchParams.get('skill');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase.from('questions').select('*');

    if (skill) {
      query = query.eq('skill', skill);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: questions, error } = await query.limit(500);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: shuffle(questions || []).slice(0, limit),
        total: questions?.length || 0,
      },
    });
  } catch (error) {
    console.error('Questions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
