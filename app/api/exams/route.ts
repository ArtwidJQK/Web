import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get fixed exams from file
    const { data: fixedExams, error: fixedError } = await supabase
      .from('exams')
      .select('*')
      .eq('source', 'file');

    if (fixedError) {
      return NextResponse.json(
        { success: false, error: fixedError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        exams: fixedExams || [],
      },
    });
  } catch (error) {
    console.error('Exams error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
