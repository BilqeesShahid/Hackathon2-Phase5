# Data Model: Advanced Task Management

## Task Entity

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `title`: VARCHAR(255) (required)
- `description`: TEXT (optional)
- `status`: ENUM('pending', 'in_progress', 'completed') (default: 'pending')
- `priority`: ENUM('high', 'medium', 'low') (default: 'medium')
- `due_date`: TIMESTAMPTZ (optional)
- `tags`: TEXT[] (array of text, max 10 elements, each max 20 chars)
- `recurrence`: VARCHAR(50) (optional, values: 'daily', 'weekly', 'monthly', 'custom')
- `recurrence_rule`: TEXT (optional, iCalendar RRULE format)
- `next_occurrence`: TIMESTAMPTZ (optional, next date for recurring tasks)
- `user_id`: UUID (foreign key to users table, required for multi-tenancy)
- `created_at`: TIMESTAMPTZ (auto-generated)
- `updated_at`: TIMESTAMPTZ (auto-generated)

**Validation Rules**:
- Title must not be empty
- Priority must be one of 'high', 'medium', 'low'
- Tags array must not exceed 10 elements
- Each tag must not exceed 20 characters
- If recurrence is set, due_date must be present
- If recurrence_rule is set, recurrence must be set

**Relationships**:
- Belongs to User (many-to-one)
- May have many TaskHistory entries (one-to-many)

## RecurrenceRule Entity

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `frequency`: VARCHAR(20) (required, values: 'daily', 'weekly', 'monthly', 'yearly')
- `interval`: INTEGER (default: 1)
- `days_of_week`: INTEGER[] (array of integers 0-6 for Sunday-Saturday)
- `days_of_month`: INTEGER[] (array of integers 1-31)
- `months`: INTEGER[] (array of integers 1-12)
- `end_date`: TIMESTAMPTZ (optional)
- `occurrence_count`: INTEGER (optional, max occurrences)
- `created_at`: TIMESTAMPTZ (auto-generated)
- `updated_at`: TIMESTAMPTZ (auto-generated)

**Validation Rules**:
- Frequency must be one of allowed values
- Interval must be positive integer
- Days of week must be between 0-6
- Days of month must be between 1-31
- Months must be between 1-12

**Relationships**:
- Belongs to Task (many-to-one)

## Event Entity

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `event_id`: VARCHAR(36) (unique event identifier)
- `type`: VARCHAR(50) (required, values: 'task.created', 'task.updated', 'task.completed', 'task.deleted', 'task.due_scheduled', 'task.reminder_triggered')
- `timestamp`: TIMESTAMPTZ (required)
- `source`: VARCHAR(100) (required, service that generated event)
- `data`: JSONB (required, event payload)
- `processed`: BOOLEAN (default: false)
- `created_at`: TIMESTAMPTZ (auto-generated)

**Validation Rules**:
- Type must be one of allowed event types
- Timestamp must be in the past or present
- Data must be valid JSON

**Relationships**:
- May reference Task (many-to-one)

## Notification Entity

**Fields**:
- `id`: UUID (primary key, auto-generated)
- `task_id`: UUID (foreign key to tasks table, required)
- `user_id`: UUID (foreign key to users table, required)
- `scheduled_time`: TIMESTAMPTZ (required, when to send notification)
- `sent_time`: TIMESTAMPTZ (optional, when notification was actually sent)
- `status`: ENUM('pending', 'sent', 'failed', 'delivered') (default: 'pending')
- `delivery_attempts`: INTEGER (default: 0)
- `channel`: VARCHAR(20) (required, values: 'email', 'push', 'sms')
- `message_content`: TEXT (required)
- `created_at`: TIMESTAMPTZ (auto-generated)
- `updated_at`: TIMESTAMPTZ (auto-generated)

**Validation Rules**:
- Status must be one of allowed values
- Delivery attempts must be non-negative
- Channel must be one of allowed channels
- Scheduled time must be in the future

**Relationships**:
- Belongs to Task (many-to-one)
- Belongs to User (many-to-one)

## State Transition Diagrams

### Task Status Transitions
```
pending ──→ in_progress ──→ completed
   ↑            │              │
   └────←───────┴────────←─────┘
```

### Notification Status Transitions
```
pending ──→ sent ──→ delivered
              │
              └─→ failed (retryable)
```

## Indexes

**Tasks table**:
- `idx_tasks_user_id` (user_id) - for user-specific queries
- `idx_tasks_status` (status) - for filtering by status
- `idx_tasks_priority` (priority) - for sorting by priority
- `idx_tasks_due_date` (due_date) - for due date filtering
- `idx_tasks_next_occurrence` (next_occurrence) - for recurring task scheduling
- `idx_tasks_created_at` (created_at) - for chronological ordering
- `idx_tasks_tags_gin` (tags) - GIN index for array operations

**Events table**:
- `idx_events_type` (type) - for filtering by event type
- `idx_events_timestamp` (timestamp) - for chronological queries
- `idx_events_processed` (processed) - for processing queries

**Notifications table**:
- `idx_notifications_scheduled_time` (scheduled_time, status) - for scheduling queries
- `idx_notifications_task_id` (task_id) - for task-specific notifications
- `idx_notifications_user_id` (user_id) - for user-specific queries