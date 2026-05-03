import Link from 'next/link';
import { ArrowRight, BookOpen, Database, GraduationCap } from 'lucide-react';
import { Card } from '@/components/shared/Card';

export default function HomePage() {
  return (
    <main className="container-main grid min-h-[calc(100vh-4rem)] gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <section className="max-w-3xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
          <GraduationCap className="h-4 w-4" />
          AVCN question bank
        </div>
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          English practice, exams, and progress tracking in one workspace.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Train with the vocabulary and grammar set from <code>avcn.txt</code>,
          then review weak skills through the dashboard after each attempt.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary inline-flex items-center gap-2 rounded-md" href="/auth/register">
            Start
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className="btn-secondary inline-flex items-center gap-2 rounded-md" href="/auth/login">
            Login
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <Card className="border-coral/40">
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-coral/15 p-3 text-coral">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Practice Mode</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                20-question sessions by skill and difficulty, with answer review.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-emerald-500/15 p-3 text-emerald-300">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Exam Mode</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Fixed papers or random 50-question tests with a 60-minute timer.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-amber-500/15 p-3 text-amber-300">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Supabase Ready</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Seed script parses the AVCN text file and creates fixed exams.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
