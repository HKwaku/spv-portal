import { NextResponse } from 'next/server';
import { getMyTasks } from '@/lib/todos-query';

export async function GET() {
  // Temporary stub until auth is added
  const userEmail = 'hope.tettey@gmail.com';
  const teams = ['fund_ops', 'tax_team', 'tpa', 'fund_counsel', 'gems_team'];

  const tasks = await getMyTasks(userEmail, teams);
  return NextResponse.json(tasks);
}