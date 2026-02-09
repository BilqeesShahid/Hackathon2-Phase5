-- Extend tasks table with advanced features
ALTER TABLE task ADD COLUMN IF NOT EXISTS
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  due_date      TIMESTAMPTZ,
  tags          TEXT[],           -- array of strings
  recurrence    TEXT,             -- e.g. "weekly", "daily", "custom:every 2 weeks"
  recurrence_rule TEXT,           -- iCalendar RRULE or simple string
  next_occurrence TIMESTAMPTZ;

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON task(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON task(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_next_occurrence ON task(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON task USING GIN (tags);