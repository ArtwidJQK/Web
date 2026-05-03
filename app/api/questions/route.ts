import { NextRequest, NextResponse } from 'next/server';
import { PracticeMode, selectAdaptiveQuestions } from '@/lib/learning-engine';
import { requireUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const skill = searchParams.get('skill');
    const mode = (searchParams.get('mode') || 'random') as PracticeMode;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!['random', 'weak', 'wrong'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid question mode' },
        { status: 400 }
      );
    }

    const questions = await selectAdaptiveQuestions({
      userId: auth.userId,
      mode,
      limit,
      skill,
    });

    return NextResponse.json({
      success: true,
      data: {
        questions,
        total: questions.length,
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
