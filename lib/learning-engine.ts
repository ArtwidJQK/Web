import { supabase } from '@/lib/supabase';
import { ErrorType, Question } from '@/lib/types';
import { shuffle } from '@/lib/utils';

type QuestionRow = Question & {
  difficulty_score?: number | null;
};

type SkillStatRow = {
  skill: string;
  correct_count: number | null;
  wrong_count: number | null;
};

type WrongQuestionRow = {
  question_id: string;
  wrong_count: number | null;
};

export type PracticeMode = 'random' | 'weak' | 'wrong';

export function skillAccuracy(stat?: SkillStatRow) {
  if (!stat) return 0.5;
  const correct = stat.correct_count || 0;
  const wrong = stat.wrong_count || 0;
  const total = correct + wrong;
  return total ? correct / total : 0.5;
}

export function classifyError(question: Pick<Question, 'skill'>): ErrorType {
  if (question.skill === 'vocab') return 'vocab_missing';
  if (question.skill === 'grammar') return 'logic_error';
  return 'unknown';
}

export async function getWeakestSkill(userId: string) {
  const { data } = await supabase
    .from('user_skill_stats')
    .select('skill, correct_count, wrong_count')
    .eq('user_id', userId);

  const rows = (data || []) as SkillStatRow[];
  if (!rows.length) return null;

  return rows
    .map((row) => ({
      skill: row.skill,
      accuracy: skillAccuracy(row),
      total: (row.correct_count || 0) + (row.wrong_count || 0),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
}

export async function selectAdaptiveQuestions({
  userId,
  mode,
  limit,
  skill,
}: {
  userId: string;
  mode: PracticeMode;
  limit: number;
  skill?: string | null;
}) {
  const [{ data: rawQuestions, error: questionError }, { data: skillStats }, { data: wrongRows }] =
    await Promise.all([
      supabase.from('questions').select('*').limit(700),
      supabase
        .from('user_skill_stats')
        .select('skill, correct_count, wrong_count')
        .eq('user_id', userId),
      supabase
        .from('wrong_questions')
        .select('question_id, wrong_count')
        .eq('user_id', userId),
    ]);

  if (questionError) throw questionError;

  const statsBySkill = new Map(
    ((skillStats || []) as SkillStatRow[]).map((row) => [row.skill, row])
  );
  const wrongByQuestion = new Map(
    ((wrongRows || []) as WrongQuestionRow[]).map((row) => [
      row.question_id,
      row.wrong_count || 0,
    ])
  );

  let pool = ((rawQuestions || []) as QuestionRow[]).filter((question) => {
    if (skill && skill !== 'mixed' && question.skill !== skill) return false;
    if (mode === 'wrong') return wrongByQuestion.has(question.id);
    return true;
  });

  if (mode === 'weak' && (!skill || skill === 'mixed')) {
    const weakest = await getWeakestSkill(userId);
    if (weakest?.skill) {
      pool = pool.filter((question) => question.skill === weakest.skill);
    }
  }

  const weighted = pool.map((question) => {
    const wrongCount = wrongByQuestion.get(question.id) || 0;
    const accuracy = skillAccuracy(statsBySkill.get(question.skill));
    const difficulty = question.difficulty_score ?? 0.5;
    const weight =
      1 +
      wrongCount * 2 +
      (1 - accuracy) * 3 +
      Math.max(0, difficulty - accuracy);

    return {
      question,
      weight: accuracy > 0.85 && wrongCount === 0 ? weight * 0.45 : weight,
    };
  });

  return shuffle(weighted)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((item) => item.question);
}

export async function recordSingleAnswer({
  userId,
  questionId,
  selected,
}: {
  userId: string;
  questionId: string;
  selected: string;
}) {
  const { data: question, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error) throw error;

  const correct = selected === question.answer;
  await updateLearningStats({
    userId,
    question,
    selected,
    correct,
  });

  return {
    question,
    selected,
    correct,
    error_type: correct ? null : classifyError(question),
  };
}

export async function updateLearningStats({
  userId,
  question,
  selected,
  correct,
}: {
  userId: string;
  question: QuestionRow;
  selected: string;
  correct: boolean;
}) {
  const { data: existingSkill } = await supabase
    .from('user_skill_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('skill', question.skill)
    .maybeSingle();

  if (existingSkill) {
    await supabase
      .from('user_skill_stats')
      .update({
        correct_count: (existingSkill.correct_count || 0) + (correct ? 1 : 0),
        wrong_count: (existingSkill.wrong_count || 0) + (correct ? 0 : 1),
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('skill', question.skill);
  } else {
    await supabase.from('user_skill_stats').insert({
      user_id: userId,
      skill: question.skill,
      correct_count: correct ? 1 : 0,
      wrong_count: correct ? 0 : 1,
    });
  }

  if (!correct) {
    const { data: wrong } = await supabase
      .from('wrong_questions')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', question.id)
      .maybeSingle();

    if (wrong) {
      await supabase
        .from('wrong_questions')
        .update({
          wrong_count: (wrong.wrong_count || 0) + 1,
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('question_id', question.id);
    } else {
      await supabase.from('wrong_questions').insert({
        user_id: userId,
        question_id: question.id,
        wrong_count: 1,
      });
    }
  } else if (selected) {
    await supabase
      .from('wrong_questions')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', question.id);
  }
}

export function buildSkillBreakdown(
  results: Array<{ question: QuestionRow; correct: boolean }>
) {
  const breakdown: Record<string, { correct: number; total: number }> = {};

  for (const result of results) {
    if (!breakdown[result.question.skill]) {
      breakdown[result.question.skill] = { correct: 0, total: 0 };
    }
    breakdown[result.question.skill].total += 1;
    if (result.correct) breakdown[result.question.skill].correct += 1;
  }

  return Object.fromEntries(
    Object.entries(breakdown).map(([skill, value]) => [
      skill,
      (value.correct / value.total) * 100,
    ])
  );
}
