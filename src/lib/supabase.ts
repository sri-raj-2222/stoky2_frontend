import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref') || supabaseUrl.includes('your-project-id')) {
  console.warn(
    "⚠️ STOKY2 Auth Warning: Supabase client is initialized with empty or placeholder credentials!\n" +
    "If you recently created or edited .env.local, you MUST restart your Next.js dev server (Ctrl+C, then npm run dev) for changes to take effect."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
