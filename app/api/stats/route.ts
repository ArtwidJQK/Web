import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = requireUser(req);
    if (auth.error) return auth.error;

    const [skillStatsRes, wrongRes, attemptsRes] = await Promise.all([
      supabase
        .from('user_skill_stats')
        .select('*')
        .eq('user_id', auth.userId)
        .order('last_updated', { ascending: false }),
      supabase
        .from('wrong_questions')
        .select('wrong_count, last_seen, questions(id, question_text, skill, topic)')
        .eq('user_id', auth.userId)
        .order('wrong_count', { ascending: false })
        .limit(6),
      supabase
        .from('attempts')
        .select('*')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    if (skillStatsRes.error) throw skillStatsRes.error;
    if (wrongRes.error) throw wrongRes.error;
    if (attemptsRes.error) throw attemptsRes.error;

    const skillStats = skillStatsRes.data || [];
    const skill_accuracy = Object.fromEntries(
      skillStats.map((row) => {
        const total = (row.correct_count || 0) + (row.wrong_count || 0);
        return [
          row.skill,
          total ? ((row.correct_count || 0) / total) * 100 : 0,
        ];
      })
    );

    const weakestSkill = skillStats
      .map((row) => {
        const total = (row.correct_count || 0) + (row.wrong_count || 0);
        return {
          skill: row.skill,
          accuracy: total ? ((row.correct_count || 0) / total) * 100 : 0,
          total,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];

    const attempts = attemptsRes.data || [];
    const totalQuestionsDone = skillStats.reduce(
      (sum, row) => sum + (row.correct_count || 0) + (row.wrong_count || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          skill_accuracy,
          skill_stats: skillStats,
          weak_skill: weakestSkill || null,
          total_questions_done: totalQuestionsDone,
          accuracy_trend: attempts
            .slice()
            .reverse()
            .map((attempt) => attempt.score ?? attempt.total_accuracy),
          last_exam_date: attempts[0]?.created_at,
        },
        wrong_questions: wrongRes.data || [],
        recent_attempts: attempts,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
