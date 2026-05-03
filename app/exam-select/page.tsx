'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Shuffle } from 'lucide-react';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/client-api';
import { Exam } from '@/lib/types';

function ExamSelectContent() {
  const router = useRouter();
  const { token } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadExams() {
      try {
        const data = await apiRequest<{ exams: Exam[] }>('/api/exams', { token });
        setExams(data.exams || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exams');
      } finally {
        setIsLoading(false);
      }
    }

    loadExams();
  }, [token]);

  async function generateRandomExam() {
    setIsGenerating(true);
    setError('');
    try {
      const exam = await apiRequest<Exam>('/api/exams/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ type: 'random' }),
      });
      router.push(`/exam/${exam.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate exam');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="container-main grid gap-6 py-8">
      <div>
        <p className="text-sm font-semibold text-coral">Exam</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Choose a paper</h1>
      </div>

      {error ? (
        <Card className="border-red-500/40 bg-red-500/10">
          <p className="text-sm font-semibold text-red-100">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-coral/40">
          <div className="mb-4 rounded-md bg-coral/15 p-3 text-coral">
            <Shuffle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Random Exam</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            50 questions, balanced between vocabulary and grammar.
          </p>
          <Button
            className="mt-5 w-full"
            isLoading={isGenerating}
            onClick={generateRandomExam}
            type="button"
          >
            Generate
          </Button>
        </Card>

        {isLoading ? (
          <Card>
            <p className="text-slate-300">Loading exams...</p>
          </Card>
        ) : (
          exams.map((exam) => (
            <Card key={exam.id}>
              <div className="mb-4 rounded-md bg-sky-500/15 p-3 text-sky-300">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">{exam.name}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {exam.total_questions} questions, {exam.time_limit} minutes
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => router.push(`/exam/${exam.id}`)}
                type="button"
                variant="secondary"
              >
                Open
              </Button>
            </Card>
          ))
        )}

        {!isLoading && exams.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-300">
              No fixed exams yet. Run the seed script after setting Supabase env.
            </p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}

export default function ExamSelectPage() {
  return (
    <RequireAuth>
      <ExamSelectContent />
    </RequireAuth>
  );
}
