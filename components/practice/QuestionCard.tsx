'use client';

import { CheckCircle2, Circle, Flag, XCircle } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Question } from '@/lib/types';
import { cn } from '@/lib/utils';

type QuestionCardProps = {
  question: Question;
  index: number;
  total: number;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  revealAnswer?: boolean;
  disabled?: boolean;
  flagged?: boolean;
  onToggleFlag?: () => void;
};

const optionKeys = ['A', 'B', 'C', 'D'] as const;

export function QuestionCard({
  question,
  index,
  total,
  selectedAnswer,
  onSelect,
  revealAnswer,
  disabled,
  flagged,
  onToggleFlag,
}: QuestionCardProps) {
  return (
    <Card className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-coral">
            Question {index + 1}/{total}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-md bg-slate-800 px-2 py-1">{question.skill}</span>
            <span className="rounded-md bg-slate-800 px-2 py-1">
              {question.difficulty}
            </span>
          </div>
        </div>
        {onToggleFlag ? (
          <Button
            aria-pressed={flagged}
            onClick={onToggleFlag}
            type="button"
            variant={flagged ? 'primary' : 'secondary'}
          >
            <Flag className="h-4 w-4" />
            Flag
          </Button>
        ) : null}
      </div>

      <h2 className="whitespace-pre-line text-xl font-semibold leading-8 text-white">
        {question.question_text}
      </h2>

      <div className="grid gap-3">
        {optionKeys.map((key) => {
          const isSelected = selectedAnswer === key;
          const isCorrect = revealAnswer && question.answer === key;
          const isWrong = revealAnswer && isSelected && question.answer !== key;

          return (
            <button
              className={cn(
                'grid min-h-12 grid-cols-[2rem_1fr] items-start gap-3 rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-coral',
                isSelected && 'border-coral bg-coral/10 text-white',
                isCorrect && 'border-emerald-400 bg-emerald-500/10',
                isWrong && 'border-red-400 bg-red-500/10'
              )}
              disabled={disabled}
              key={key}
              onClick={() => onSelect(key)}
              type="button"
            >
              <span className="mt-0.5 text-coral">
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : isWrong ? (
                  <XCircle className="h-5 w-5 text-red-300" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </span>
              <span>
                <span className="mr-2 font-bold">{key}.</span>
                {question.options[key]}
              </span>
            </button>
          );
        })}
      </div>

      {revealAnswer ? (
        <div className="rounded-md border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
          <p>
            Answer:{' '}
            <span className="font-semibold text-white">{question.answer}</span>
          </p>
          {question.explanation ? (
            <p className="mt-2 leading-6">{question.explanation}</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
