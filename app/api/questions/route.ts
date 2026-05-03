import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Random order, limit, exclude file source (to avoid repetition)
    const { data: questions, error, count } = await query
      .eq('source', 'generated')
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: questions || [],
        total: count || 0,
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
