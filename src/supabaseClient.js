import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL; // Supabase 프로젝트 URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY; // Supabase 익명 키

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);