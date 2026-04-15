import { NextResponse } from 'next/server';
import { getActionableTodos } from '@/lib/todos-query';

export const dynamic = 'force-dynamic';

export async function GET() {
  const todos = await getActionableTodos();
  return NextResponse.json({ todos, count: todos.length });
}
