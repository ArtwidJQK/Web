import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, email } = RegisterSchema.parse(body);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        email,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Create user stats record
    await supabase.from('user_stats').insert({
      user_id: data.id,
      skill_accuracy: { vocab: 0, grammar: 0 },
      error_distribution: {},
    });

    await supabase.from('user_skill_stats').insert([
      { user_id: data.id, skill: 'vocab', correct_count: 0, wrong_count: 0 },
      { user_id: data.id, skill: 'grammar', correct_count: 0, wrong_count: 0 },
    ]);

    const token = signToken(data.id);

    return NextResponse.json({
      success: true,
      data: {
        user_id: data.id,
        username: data.username,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
