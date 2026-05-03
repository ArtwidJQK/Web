import { NextRequest, NextResponse } from 'next/server';
import { recordSingleAnswer } from '@/lib/learning-engine';
import { requireUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const questionId = body.question_id;
    const selected = body.selected;

    if (!questionId || !selected) {
      return NextResponse.json(
        { success: false, error: 'question_id and selected are required' },
        { status: 400 }
      );
    }

    const result = await recordSingleAnswer({
      userId: auth.userId,
      questionId,
      selected,
    });

    return NextResponse.json({
      success: true,
      data: {
        correct: result.correct,
        selected,
        correct_answer: result.question.answer,
        explanation: result.question.explanation,
        error_type: result.error_type,
      },
    });
  } catch (error) {
    console.error('Answer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record answer' },
      { status: 500 }
    );
  }
}
