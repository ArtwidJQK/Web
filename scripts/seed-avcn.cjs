const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const rootDir = path.resolve(__dirname, '..');
const avcnPath = path.join(rootDir, 'avcn.txt');
const args = new Set(process.argv.slice(2));

function loadEnvFile() {
  const envPath = path.join(rootDir, '.env.local');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;
    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeLine(line) {
  return line
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function parseAnswerPairs(line) {
  const pairs = [];
  const regex = /(\d{1,2})\s*\.?\s*([A-D])(?=\s|\d|$)/g;
  let match;

  while ((match = regex.exec(line))) {
    pairs.push({
      number: Number(match[1]),
      answer: match[2],
    });
  }

  return pairs;
}

function isAnswerKeyLine(line) {
  return parseAnswerPairs(line).length >= 3;
}

function isInstruction(line) {
  return (
    /^part\s/i.test(line) ||
    /^choose\s/i.test(line) ||
    /^[AB]\.\s*(choose|complete)\s/i.test(line)
  );
}

function looksLikeOptionLine(line) {
  return (
    /(^|\s)[A-D]\s*\.\s+/.test(line) ||
    /\s[B-D]\s*\.\s*/.test(line) ||
    /\s[B-D]\s+(?=\S)/.test(line)
  );
}

function addOption(options, label, value) {
  const clean = normalizeLine(value).replace(/\s+([,.!?])/g, '$1');
  if (!clean) return;
  options[label] = options[label] ? `${options[label]} ${clean}` : clean;
}

function parseOptions(optionLines) {
  const options = {};

  for (const rawLine of optionLines) {
    let line = normalizeLine(rawLine);
    if (!line) continue;

    line = line.replace(/^([A-D])\s+(?=\S)/, '$1. ');
    line = line.replace(/\s([B-D])\s+(?=\S)/g, ' $1. ');

    const markerRegex = /([A-D])\.\s*/g;
    const markers = [];
    let match;
    while ((match = markerRegex.exec(line))) {
      markers.push({
        label: match[1],
        start: match.index,
        end: markerRegex.lastIndex,
      });
    }

    if (markers.length === 0) continue;

    const prefix = line.slice(0, markers[0].start).trim();
    if (prefix) {
      addOption(options, markers[0].label === 'D' ? 'B' : 'A', prefix);
    }

    markers.forEach((marker, index) => {
      const next = markers[index + 1];
      const value = line.slice(marker.end, next ? next.start : line.length);
      addOption(options, marker.label, value);
    });
  }

  return {
    A: options.A || '',
    B: options.B || '',
    C: options.C || '',
    D: options.D || '',
  };
}

function parseQuestionBlocks(lines, answerPairs) {
  const chunks = [];
  let current = null;
  const topicLines = [];

  function pushCurrent() {
    if (!current) return;
    if (current.questionLines.length && current.optionLines.length) {
      chunks.push(current);
    }
    current = null;
  }

  for (const raw of lines) {
    const line = normalizeLine(raw);
    if (!line) continue;

    const numbered = line.match(/^(\d{1,2})\.\s*(.+)$/);

    if (!current && isInstruction(line)) {
      topicLines.push(line);
      continue;
    }

    if (numbered && answerPairs.some((pair) => pair.number === Number(numbered[1]))) {
      pushCurrent();
      current = {
        number: Number(numbered[1]),
        questionLines: [numbered[2]],
        optionLines: [],
      };
      continue;
    }

    const optionLine = looksLikeOptionLine(line);

    if (optionLine && current) {
      current.optionLines.push(line);
      continue;
    }

    if (!current) {
      current = {
        number: undefined,
        questionLines: [line],
        optionLines: [],
      };
      continue;
    }

    if (current.optionLines.length > 0) {
      pushCurrent();
      current = {
        number: undefined,
        questionLines: [line],
        optionLines: [],
      };
    } else {
      current.questionLines.push(line);
    }
  }

  pushCurrent();

  return chunks.map((chunk, index) => {
    const pair =
      answerPairs.find((item) => item.number === chunk.number) || answerPairs[index];
    const questionText = normalizeLine(chunk.questionLines.join(' '));
    const options = parseOptions(chunk.optionLines);

    return {
      originalNumber: pair?.number || chunk.number || index + 1,
      question_text: questionText,
      answer: pair?.answer || 'A',
      options,
      topic: topicLines[topicLines.length - 1] || 'AVCN',
    };
  });
}

function parseAvcnFile() {
  const rawText = fs.readFileSync(avcnPath, 'utf8');
  const rawLines = rawText.split(/\r?\n/);
  const sections = [];
  let buffer = [];

  for (const line of rawLines) {
    const normalized = normalizeLine(line);
    if (normalized && isAnswerKeyLine(normalized)) {
      sections.push({
        lines: buffer,
        answers: parseAnswerPairs(normalized),
      });
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  const questions = [];
  const warnings = [];

  sections.forEach((section, sectionIndex) => {
    const parsed = parseQuestionBlocks(section.lines, section.answers);
    if (parsed.length !== section.answers.length) {
      warnings.push(
        `Section ${sectionIndex + 1}: parsed ${parsed.length}/${section.answers.length}`
      );
    }
    questions.push(
      ...parsed.map((question) => ({
        ...question,
        sectionIndex,
      }))
    );
  });

  return {
    warnings,
    questions: questions.map((question, index) => {
      const answerText = question.options[question.answer] || '';
      const difficulty = index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard';
      const skill = index < 120 ? 'vocab' : 'grammar';

      return {
        question_text: question.question_text,
        text: question.question_text,
        answer: question.answer,
        options: question.options,
        skill,
        difficulty,
        difficulty_score: difficulty === 'easy' ? 0.25 : difficulty === 'hard' ? 0.8 : 0.5,
        topic: question.topic,
        explanation: answerText
          ? `Correct answer: ${question.answer}. ${answerText}`
          : `Correct answer: ${question.answer}.`,
        source: 'file',
      };
    }),
  };
}

async function seedSupabase(questions) {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { count, error: countError } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'file');

  if (countError) throw countError;

  if (count && count > 0 && !args.has('--reset')) {
    throw new Error(
      `Database already has ${count} file questions. Use "npm run seed -- --reset" to reseed.`
    );
  }

  if (args.has('--reset')) {
    await supabase.from('practice_recommendations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('exams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const insertedQuestions = [];
  for (let index = 0; index < questions.length; index += 100) {
    const chunk = questions.slice(index, index + 100);
    const { data, error } = await supabase.from('questions').insert(chunk).select('id');
    if (error) throw error;
    insertedQuestions.push(...(data || []));
  }

  const examRows = [];
  for (let index = 0; index < 4; index++) {
    const questionIds = insertedQuestions
      .slice(index * 50, index * 50 + 50)
      .map((question) => question.id);

    if (questionIds.length === 0) continue;

    examRows.push({
      name: `AVCN Fixed Exam ${index + 1}`,
      question_ids: questionIds,
      total_questions: questionIds.length,
      time_limit: 60,
      source: 'file',
      difficulty_distribution: {
        source: 'avcn.txt',
        batch: index + 1,
      },
    });
  }

  const { error: examError } = await supabase.from('exams').insert(examRows);
  if (examError) throw examError;

  return {
    questions: insertedQuestions.length,
    exams: examRows.length,
  };
}

async function main() {
  const { questions, warnings } = parseAvcnFile();
  const skillCounts = questions.reduce(
    (acc, question) => {
      acc[question.skill] += 1;
      return acc;
    },
    { vocab: 0, grammar: 0 }
  );

  console.log(`Parsed ${questions.length} questions`);
  console.log(`Vocabulary: ${skillCounts.vocab}`);
  console.log(`Grammar: ${skillCounts.grammar}`);

  if (warnings.length) {
    console.warn('Parser warnings:');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  if (args.has('--dry-run')) {
    console.log('First question preview:');
    console.log(JSON.stringify(questions[0], null, 2));
    return;
  }

  const result = await seedSupabase(questions);
  console.log(`Seeded ${result.questions} questions and ${result.exams} fixed exams`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
