'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, GraduationCap, RefreshCw, Target } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ProgressBar } from '@/components/learning/ProgressBar';
import { SkillTag } from '@/components/learning/SkillTag';
import { StatCard } from '@/components/learning/StatCard';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/client-api';
import { Attempt } from '@/lib/types';
import { clampPercentage } from '@/lib/utils';

type SkillStat = {
  skill: string;
  correct_count: number;
  wrong_count: number;
};

type StatsPayload = {
  stats: {
    skill_accuracy: Record<string, number>;
    skill_stats: SkillStat[];
    weak_skill: { skill: string; accuracy: number; total: number } | null;
    total_questions_done: number;
    accuracy_trend: number[];
    last_exam_date?: string;
  };
  wrong_questions: Array<{
    wrong_count: number;
    questions?: {
      id: string;
      question_text: string;
      skill: string;
      topic?: string;
    };
  }>;
  recent_attempts: Attempt[];
};

function DashboardContent() {
  const { token, user } = useAuth();
  const [payload, setPayload] = useState<StatsPayload | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<StatsPayload>('/api/stats', { token });
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const weakSkill = payload?.stats.weak_skill;
  const recentScore = payload?.recent_attempts?.[0]?.score ?? payload?.recent_attempts?.[0]?.total_accuracy;
  const averageScore = useMemo(() => {
    const trend = payload?.stats.accuracy_trend || [];
    if (!trend.length) return 0;
    return trend.reduce((sum, item) => sum + item, 0) / trend.length;
  }, [payload?.stats.accuracy_trend]);

  return (
    <main className="container-main grid gap-8 py-8">
      <header className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="meta-text text-coral">Learning dashboard</p>
          <h1 className="page-title mt-2">Chào {user?.username}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Dashboard tập trung vào vòng lặp học: điểm gần đây, kỹ năng yếu, và câu sai cần quay lại.
          </p>
        </div>
        <Button onClick={loadStats} type="button" variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </header>

      {error ? (
        <Card className="bg-amber-300 text-navy">
          <p className="font-semibold">{error}</p>
          <p className="mt-2 text-sm text-navy/70">
            Hãy chạy lại `database.sql`, seed data, và kiểm tra `.env.local`.
          </p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-slate-300">Loading stats...</p>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard
              detail="Latest exam or practice attempt"
              label="Recent performance"
              tone="accent"
              value={recentScore === undefined ? '--' : `${clampPercentage(recentScore)}%`}
            />
            <StatCard
              detail="Average of recent attempts"
              label="Trend"
              value={`${clampPercentage(averageScore)}%`}
            />
            <StatCard
              detail="Tracked by the learning engine"
              label="Questions answered"
              value={`${payload?.stats.total_questions_done || 0}`}
            />
            <StatCard
              detail={weakSkill ? `${clampPercentage(weakSkill.accuracy)}% accuracy` : 'Not enough data'}
              label="Weak skill"
              tone={weakSkill ? 'warning' : 'neutral'}
              value={weakSkill?.skill || '--'}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="section-title">Skill clarity</h2>
                  <p className="meta-text mt-2">Accuracy by skill</p>
                </div>
                <Target className="h-6 w-6 text-coral" />
              </div>
              <div className="mt-8 grid gap-6">
                {['vocab', 'grammar'].map((skill) => (
                  <ProgressBar
                    key={skill}
                    label={skill}
                    value={payload?.stats.skill_accuracy?.[skill] || 0}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="section-title">Next best action</h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                {weakSkill
                  ? `Kỹ năng yếu nhất hiện tại là ${weakSkill.skill}. Hệ thống sẽ ưu tiên câu thuộc nhóm này trong Weakness Practice.`
                  : 'Làm một practice hoặc exam để hệ thống đủ dữ liệu đề xuất.'}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                  className="btn-primary"
                  href={`/practice?mode=weak${weakSkill ? `&skill=${weakSkill.skill}` : ''}`}
                >
                  <BookOpen className="h-4 w-4" />
                  Practice weak area
                </Link>
                <Link className="btn-secondary" href="/exam-select">
                  <GraduationCap className="h-4 w-4" />
                  Take exam
                </Link>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card>
              <h2 className="section-title">Wrong questions</h2>
              <div className="mt-6 grid gap-4">
                {(payload?.wrong_questions || []).map((item) => (
                  <div className="rounded-md bg-surface-strong p-4" key={item.questions?.id}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <SkillTag tone="warning">Wrong x{item.wrong_count}</SkillTag>
                      {item.questions?.skill ? <SkillTag>{item.questions.skill}</SkillTag> : null}
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-300">
                      {item.questions?.question_text}
                    </p>
                  </div>
                ))}
                {!payload?.wrong_questions?.length ? (
                  <p className="text-base text-slate-400">Chưa có câu sai được ghi nhận.</p>
                ) : null}
              </div>
            </Card>

            <Card>
              <h2 className="section-title">History</h2>
              <div className="mt-6 grid gap-2">
                {(payload?.recent_attempts || []).map((attempt) => (
                  <div
                    className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md bg-surface-strong px-4 py-4"
                    key={attempt.id}
                  >
                    <div>
                      <p className="text-sm font-semibold text-lotus">
                        {new Date(attempt.created_at).toLocaleString()}
                      </p>
                      <p className="meta-text mt-1">
                        {Object.keys(attempt.skill_breakdown || {}).join(', ') || 'exam'}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold text-coral">
                      {clampPercentage(attempt.score ?? attempt.total_accuracy)}%
                    </p>
                  </div>
                ))}
                {!payload?.recent_attempts?.length ? (
                  <p className="text-base text-slate-400">Chưa có lịch sử làm bài.</p>
                ) : null}
              </div>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
