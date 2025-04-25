import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function checkEnv(name: string): boolean {
  return Boolean(process.env[name]);
}

export async function GET() {
  // Check required environment variables
  const vars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const envStatus: Record<string, boolean> = {};
  for (const v of vars) {
    envStatus[v] = checkEnv(v);
  }

  // Check Supabase connectivity
  let supabaseStatus = false;
  if (envStatus['NEXT_PUBLIC_SUPABASE_URL'] && envStatus['SUPABASE_SERVICE_ROLE_KEY']) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
      );
      const { error } = await supabase.from('users').select('id').limit(1).maybeSingle();
      supabaseStatus = !error;
    } catch {
      supabaseStatus = false;
    }
  }

  return NextResponse.json({
    success: true,
    env: envStatus,
    services: {
      supabase: supabaseStatus
    }
  });
}