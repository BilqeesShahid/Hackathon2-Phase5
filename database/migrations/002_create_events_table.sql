-- Create events table for event sourcing
CREATE TABLE IF NOT EXISTS event (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(36) UNIQUE NOT NULL,  -- UUID string
    type VARCHAR(50) NOT NULL,             -- event type
    timestamp TIMESTAMPTZ NOT NULL,        -- when event occurred
    source VARCHAR(100) NOT NULL,          -- which service generated event
    data JSONB NOT NULL,                   -- event payload
    processed BOOLEAN DEFAULT FALSE,       -- whether event has been processed
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_type ON event(type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON event(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_processed ON event(processed);
CREATE INDEX IF NOT EXISTS idx_events_source ON event(source);