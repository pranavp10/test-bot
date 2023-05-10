import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yfnpraftrjzpljagrzji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbnByYWZ0cmp6cGxqYWdyemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODMxODQwMDgsImV4cCI6MTk5ODc2MDAwOH0.u1gViHf4swTg8ftqIC8zcSmKFF8Utx9OSMYqZfeL6Aw';

if (!SUPABASE_URL) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
if (!SUPABASE_ANON_KEY) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
