'use client';

import { Flag } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { AnswerOption } from '@/components/learning/AnswerOption';
import { ExplanationPanel } from '@/components/learning/ExplanationPanel';
import { SkillTag } from '@/components/learning/SkillTag';
import { Question } from '@/lib/types';

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
  showExplanation = true,
}: {
  question: Question;
  index: number;
  total: number;
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  revealAnswer?: boolean;
  disabled?: boolean;
  flagged?: boolean;
  onToggleFlag?: () => void;
  showExplanation?: boolean;
}) {
  return (
    <section className="grid gap-6 rounded-md bg-surface p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkillTag tone="accent">
            {index + 1}/{total}
          </SkillTag>
          <SkillTag>{question.skill}</SkillTag>
          {question.topic ? <SkillTag>{question.topic}</SkillTag> : null}
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

      <h2 className="max-w-5xl whitespace-pre-line text-xl font-semibold leading-8 text-lotus md:text-2xl">
        {question.question_text}
      </h2>

      <div className="grid gap-4">
        {optionKeys.map((key) => {
          const isSelected = selectedAnswer === key;
          const isCorrect = revealAnswer && question.answer === key;
          const isWrong = revealAnswer && isSelected && question.answer !== key;

          return (
            <AnswerOption
              correct={isCorrect}
              disabled={disabled}
              key={key}
              onSelect={() => onSelect(key)}
              optionKey={key}
              selected={isSelected}
              wrong={isWrong}
            >
              {question.options[key]}
            </AnswerOption>
          );
        })}
      </div>

      {revealAnswer && showExplanation ? (
        <ExplanationPanel
          answer={question.answer}
          explanation={question.explanation}
        />
      ) : null}
    </section>
  );
}
