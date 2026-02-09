-- Create notifications table for reminders
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    sent_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    delivery_attempts INTEGER DEFAULT 0,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'push', 'sms')), -- delivery channel
    message_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient scheduling and querying
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_time ON notification(scheduled_time, status);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notification(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification(status);