import { NextRequest, NextResponse } from 'next/server';
import { buildSkillBreakdown, classifyError, updateLearningStats } from '@/lib/learning-engine';
import { requireUser } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';
import { ErrorType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const examId = body.exam_id;
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const totalTime = Number(body.total_time || 0);

    if (!examId || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'exam_id and answers are required' },
        { status: 400 }
      );
    }

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (examError) throw examError;

    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .in('id', exam.question_ids);

    if (questionError) throw questionError;

    const questionMap = new Map((questions || []).map((question) => [question.id, question]));
    const answerMap = new Map(
      answers.map((answer: { question_id: string; selected?: string; answer?: string }) => [
        answer.question_id,
        answer.selected || answer.answer || '',
      ])
    );

    const results: Array<{ question: any; selected: string; correct: boolean }> = exam.question_ids
      .map((questionId: string) => questionMap.get(questionId))
      .filter(Boolean)
      .map((question: any) => {
        const selected = answerMap.get(question.id) || '';
        const correct = selected === question.answer;
        return { question, selected, correct };
      });

    const correctCount = results.filter((result) => result.correct).length;
    const score = (correctCount / results.length) * 100;
    const skillBreakdown = buildSkillBreakdown(results);
    const errorDistribution: Record<ErrorType, number> = {
      vocab_missing: 0,
      logic_error: 0,
      hasty_read: 0,
      misunderstood: 0,
      unknown: 0,
    };

    for (const result of results) {
      if (!result.correct) {
        errorDistribution[classifyError(result.question)] += 1;
      }
    }

    const questionAttempts = results.map((result) => ({
      question_id: result.question.id,
      user_answer: result.selected,
      correct_answer: result.question.answer,
      is_correct: result.correct,
      time_spent: 0,
      error_type: result.correct ? null : classifyError(result.question),
      skipped: !result.selected,
    }));

    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: auth.userId,
        exam_id: examId,
        score,
        total_accuracy: score,
        question_attempts: questionAttempts,
        total_time: totalTime,
        skill_breakdown: skillBreakdown,
        error_distribution: errorDistribution,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    const answerRows = results.map((result) => ({
      attempt_id: attempt.id,
      question_id: result.question.id,
      selected: result.selected,
      correct: result.correct,
    }));

    const { error: answersError } = await supabase.from('answers').insert(answerRows);
    if (answersError) throw answersError;

    await Promise.all(
      results.map((result) =>
        updateLearningStats({
          userId: auth.userId,
          question: result.question,
          selected: result.selected,
          correct: result.correct,
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        attempt_id: attempt.id,
        accuracy: score,
        score,
        skill_breakdown: skillBreakdown,
        error_distribution: errorDistribution,
        review: results.map((result) => ({
          question: result.question,
          selected: result.selected,
          correct: result.correct,
          correct_answer: result.question.answer,
        })),
      },
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit exam' },
      { status: 500 }
    );
  }
}
