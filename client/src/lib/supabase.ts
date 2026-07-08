import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL!;
const key = process.env.PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);
