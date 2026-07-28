import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zzwrkcarexnqgfsmkvhi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6d3JrY2FyZXhucWdmc21rdmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDE4MzAsImV4cCI6MjA5NjA3NzgzMH0.r1q1INvX_kTMJeqzW_497oWBw1RoNZfjDiFV426I2mc'
)