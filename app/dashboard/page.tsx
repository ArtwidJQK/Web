'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, GraduationCap, RefreshCw } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/client-api';
import { Attempt, UserStats } from '@/lib/types';
import { ErrorChart } from '@/components/dashboard/ErrorChart';
import { SkillChart } from '@/components/dashboard/SkillChart';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { clampPercentage } from '@/lib/utils';

type StatsPayload = {
  stats: UserStats;
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
      const data = await apiRequest<StatsPayload>('/api/stats/user', { token });
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

  const stats = payload?.stats;

  return (
    <main className="container-main grid gap-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-coral">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Hi {user?.username}, ready for the next set?
          </h1>
        </div>
        <Button onClick={loadStats} type="button" variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <p className="font-semibold text-amber-100">{error}</p>
          <p className="mt-2 text-sm text-amber-50/80">
            Check `.env.local`, Supabase schema, and seeded questions.
          </p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-slate-300">Loading stats...</p>
        </Card>
      ) : (
        <>
          <StatsOverview
            grammarAccuracy={stats?.skill_accuracy?.grammar || 0}
            lastExamDate={stats?.last_exam_date}
            totalQuestions={stats?.total_questions_done || 0}
            vocabAccuracy={stats?.skill_accuracy?.vocab || 0}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <SkillChart skillAccuracy={stats?.skill_accuracy} />
            <ErrorChart errorDistribution={stats?.error_distribution} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <h2 className="text-lg font-bold text-white">Start</h2>
              <div className="mt-5 grid gap-3">
                <Link className="btn-primary inline-flex items-center justify-center gap-2 rounded-md" href="/practice">
                  <BookOpen className="h-4 w-4" />
                  Practice
                </Link>
                <Link className="btn-secondary inline-flex items-center justify-center gap-2 rounded-md" href="/exam-select">
                  <GraduationCap className="h-4 w-4" />
                  Exam
                </Link>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-white">Recent Attempts</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Accuracy</th>
                      <th className="py-2">Vocab</th>
                      <th className="py-2">Grammar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {(payload?.recent_attempts || []).map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="py-3">
                          {new Date(attempt.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 font-semibold text-white">
                          {clampPercentage(attempt.total_accuracy)}%
                        </td>
                        <td className="py-3">
                          {clampPercentage(attempt.skill_breakdown?.vocab)}%
                        </td>
                        <td className="py-3">
                          {clampPercentage(attempt.skill_breakdown?.grammar)}%
                        </td>
                      </tr>
                    ))}
                    {!payload?.recent_attempts?.length ? (
                      <tr>
                        <td className="py-4 text-slate-500" colSpan={4}>
                          No attempts yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
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
