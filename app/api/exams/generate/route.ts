import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body; // 'random'

    if (type === 'random') {
      // Get random vocab questions (20)
      const { data: vocabQuestions, error: vocabError } = await supabase
        .from('questions')
        .select('id')
        .eq('skill', 'vocab')
        .eq('source', 'generated')
        .limit(20);

      if (vocabError) throw vocabError;

      // Get random grammar questions (30)
      const { data: grammarQuestions, error: grammarError } = await supabase
        .from('questions')
        .select('id')
        .eq('skill', 'grammar')
        .eq('source', 'generated')
        .limit(30);

      if (grammarError) throw grammarError;

      const questionIds = [
        ...(vocabQuestions?.map(q => q.id) || []),
        ...(grammarQuestions?.map(q => q.id) || []),
      ];

      // Create exam record
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          name: `Random Exam - ${new Date().toISOString()}`,
          question_ids: questionIds,
          total_questions: questionIds.length,
          time_limit: 60,
          source: 'random',
        })
        .select()
        .single();

      if (examError) throw examError;

      return NextResponse.json({
        success: true,
        data: exam,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid exam type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Generate exam error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate exam' },
      { status: 500 }
    );
  }
}
