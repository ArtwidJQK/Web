import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { shuffle } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type QuestionRow = {
  id: string;
  skill: string;
  difficulty: string;
};

async function getQuestionIds({
  skill,
  difficulty,
  limit,
}: {
  skill?: string;
  difficulty?: string;
  limit: number;
}) {
  let query = supabase
    .from('questions')
    .select('id, skill, difficulty')
    .limit(500);

  if (skill && skill !== 'mixed') {
    query = query.eq('skill', skill);
  }

  if (difficulty && difficulty !== 'all') {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query;
  if (error) throw error;

  return shuffle((data || []) as QuestionRow[])
    .slice(0, limit)
    .map((question) => question.id);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === 'random') {
      const vocabIds = await getQuestionIds({ skill: 'vocab', limit: 20 });
      const grammarIds = await getQuestionIds({ skill: 'grammar', limit: 30 });
      let questionIds = shuffle([...vocabIds, ...grammarIds]);

      if (questionIds.length < 50) {
        const fillIds = await getQuestionIds({ limit: 50 });
        questionIds = shuffle(Array.from(new Set([...questionIds, ...fillIds]))).slice(
          0,
          50
        );
      }

      if (questionIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No questions found. Run npm run seed first.' },
          { status: 400 }
        );
      }

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

      return NextResponse.json({ success: true, data: exam });
    }

    if (type === 'practice') {
      const limit = Math.min(Number(body.limit) || 20, 50);
      const questionIds = await getQuestionIds({
        skill: body.skill,
        difficulty: body.difficulty,
        limit,
      });

      if (questionIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No questions found. Run npm run seed first.' },
          { status: 400 }
        );
      }

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          name: `Practice - ${new Date().toLocaleString()}`,
          question_ids: questionIds,
          total_questions: questionIds.length,
          time_limit: 20,
          source: 'random',
        })
        .select()
        .single();

      if (examError) throw examError;

      return NextResponse.json({ success: true, data: exam });
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
