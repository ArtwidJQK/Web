import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { exam_id: string } }
) {
  try {
    const examId = params.exam_id;

    // Get exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examError) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Get questions
    const { data: rawQuestions, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .in('id', exam.question_ids);

    if (questionError) throw questionError;

    const questionsById = new Map(
      (rawQuestions || []).map((question) => [question.id, question])
    );
    const questions = exam.question_ids
      .map((id: string) => questionsById.get(id))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        exam,
        questions,
      },
    });
  } catch (error) {
    console.error('Get exam error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}
