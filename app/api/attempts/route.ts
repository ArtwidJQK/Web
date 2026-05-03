import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractTokenFromHeader, verifyToken } from '@/lib/jwt';
import { ErrorType } from '@/lib/types';

export const dynamic = 'force-dynamic';

function classifyError(
  _question: any,
  _userAnswer: string,
  _correctAnswer: string
): ErrorType {
  // Simple classification for MVP
  if (_question.skill === 'vocab') {
    return 'vocab_missing';
  }
  if (_question.skill === 'grammar') {
    return 'logic_error';
  }
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const token = extractTokenFromHeader(req.headers.get('authorization') || '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const body = await req.json();
    const { exam_id, answers } = body;

    if (!exam_id || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid attempt payload' },
        { status: 400 }
      );
    }

    // Get exam questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError) throw examError;

    // Get all questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', exam.question_ids);

    if (questionsError) throw questionsError;

    const questionsById = new Map((questions || []).map((question) => [question.id, question]));

    // Grade answers
    let correctCount = 0;
    const errorDistribution: Record<ErrorType, number> = {
      vocab_missing: 0,
      logic_error: 0,
      hasty_read: 0,
      misunderstood: 0,
      unknown: 0,
    };

    const skillBreakdown: Record<string, {correct: number; total: number}> = {};
    const questionAttempts = answers.map((answer: any) => {
      const question = questionsById.get(answer.question_id);
      if (!question) {
        throw new Error(`Question not found: ${answer.question_id}`);
      }

      const userAnswer = answer.answer || '';
      const isCorrect = userAnswer === question.answer;

      if (isCorrect) correctCount++;

      // Track by skill
      if (!skillBreakdown[question.skill]) {
        skillBreakdown[question.skill] = {correct: 0, total: 0};
      }
      skillBreakdown[question.skill].total++;
      if (isCorrect) {
        skillBreakdown[question.skill].correct++;
      }

      // Classify error
      const submittedErrorType = answer.error_type as ErrorType | undefined;
      const errorType: ErrorType = isCorrect
        ? 'unknown'
        : submittedErrorType && submittedErrorType in errorDistribution
          ? submittedErrorType
          : classifyError(question, userAnswer, question.answer);
      if (errorType !== 'unknown') {
        errorDistribution[errorType]++;
      }

      return {
        question_id: answer.question_id,
        user_answer: userAnswer,
        correct_answer: question.answer,
        is_correct: isCorrect,
        time_spent: answer.time_spent || 0,
        error_type: isCorrect ? null : errorType,
        skipped: !userAnswer,
      };
    });

    // Calculate accuracy
    const totalAccuracy = (correctCount / questionAttempts.length) * 100;

    // Convert skill breakdown to percentages
    const skillAccuracy: Record<string, number> = {};
    for (const [skill, data] of Object.entries(skillBreakdown)) {
      skillAccuracy[skill] = (data.correct / data.total) * 100;
    }

    // Save attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: userId,
        exam_id,
        question_attempts: questionAttempts,
        total_time: answers.reduce((sum: number, a: any) => sum + (a.time_spent || 0), 0),
        total_accuracy: totalAccuracy,
        skill_breakdown: skillAccuracy,
        error_distribution: errorDistribution,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Update user stats
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const weakSkills = Object.entries(skillAccuracy)
      .filter(([, accuracy]) => accuracy < 80)
      .map(([skill]) => skill);

    if (currentStats) {
      const newAccuracyTrend = [...(currentStats.accuracy_trend || []), totalAccuracy];
      if (newAccuracyTrend.length > 4) newAccuracyTrend.shift();

      const mergedSkillAccuracy = {
        ...(currentStats.skill_accuracy || {}),
        ...skillAccuracy,
      };
      const mergedErrorDistribution = {
        ...(currentStats.error_distribution || {}),
      };
      for (const [key, value] of Object.entries(errorDistribution)) {
        mergedErrorDistribution[key] = (mergedErrorDistribution[key] || 0) + value;
      }

      await supabase
        .from('user_stats')
        .update({
          skill_accuracy: mergedSkillAccuracy,
          weak_skills: weakSkills,
          accuracy_trend: newAccuracyTrend,
          total_questions_done:
            (currentStats.total_questions_done || 0) + questionAttempts.length,
          last_exam_date: new Date().toISOString(),
          error_distribution: mergedErrorDistribution,
        })
        .eq('user_id', userId);
    } else {
      await supabase.from('user_stats').insert({
        user_id: userId,
        skill_accuracy: skillAccuracy,
        weak_skills: weakSkills,
        total_questions_done: questionAttempts.length,
        last_exam_date: new Date().toISOString(),
        accuracy_trend: [totalAccuracy],
        error_distribution: errorDistribution,
      });
    }

    if (weakSkills.length > 0 || totalAccuracy < 80) {
      const recommendedSkill = weakSkills[0] || 'grammar';
      await supabase.from('practice_recommendations').insert({
        user_id: userId,
        recommended_skill: recommendedSkill,
        recommended_count: 20,
        reason: `Accuracy ${totalAccuracy.toFixed(1)}%, focus on ${recommendedSkill}.`,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        attempt_id: attempt.id,
        accuracy: totalAccuracy,
        skill_breakdown: skillAccuracy,
        error_distribution: errorDistribution,
      },
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit attempt' },
      { status: 500 }
    );
  }
}
