import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adwtcdhtffsmzprscevu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd3RjZGh0ZmZzbXpwcnNjZXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMwNDMsImV4cCI6MjA4NTY4OTA0M30.JBd6rRI7UctgHhKNrzLC6xx5MKt1PWJlQsXhWQBwFqM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Query information_schema.tables to see what tables exist in public schema
  // Unfortunately, REST API usually blocks information_schema.
  // We can just try to fetch a hypothetical 'workspace_settings' table
  const { data, error } = await supabase.from('workspace_settings').select('*').limit(1);
  console.log('workspace_settings:', error ? error.message : 'exists');
}

check();
