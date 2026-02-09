# Feature Specification: Advanced Task Management (Recurring Tasks, Due Date Reminders, Priorities, Tags, Search/Filter)

**Feature Branch**: `001-advanced-tasks`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "for phase 5 # Feature Spec: Recurring Tasks

## Goal
Enable users to create tasks that automatically regenerate based on recurrence rules (daily, weekly, custom), without manual duplication.

## User Stories
- As a user, I can say "add weekly meeting every Monday at 10am" and future tasks are auto-created.
- As a user, I can view upcoming recurring instances.
- As a user, I can edit or stop recurrence.

## Acceptance Criteria
- Recurring rules stored in `tasks.recurrence` and `tasks.recurrence_rule`
- On task completion, next task instance is auto-created
- Kafka event `task.completed` is emitted
- recurring-task-service consumes event and publishes `task.created`
- New task inherits title, tags, priority, due_date adjusted

## Non-Goals
- Calendar sync
- External integrations

## Error Handling
- Invalid recurrence rule → reject with 400
- Missing due_date → recurrence disabled

## Observability
- Logs emitted on recurrence creation
- Metrics: recurring_tasks_created_total

## Event Flow
task.completed → Kafka topic `task-events` → recurring-task-service → new task created → Kafka `task-created`

## Dependencies
- Kafka via Dapr Pub/Sub
- PostgreSQL via Dapr State Store
📁 /specs/features/due-date-reminders.md
# Feature Spec: Due Date & Time Reminders

## Goal
Notify users when tasks reach their due date and time.

## User Stories
- As a user, I can set a due date and time for a task.
- As a user, I receive a reminder when the time arrives.

## Acceptance Criteria
- Tasks with `due_date` emit `task.due_scheduled`
- Dapr cron binding schedules reminder
- notification-service consumes reminder event
- Notification logged or pushed

## Event Flow
task.created → Kafka `reminders` → Dapr cron binding → notification-service

## Failure Handling
- Failed reminder retries 3 times
- Logs emitted on failure

## Observability
- reminder_sent_total metric
📁 /specs/features/priorities.md
# Feature Spec: Task Priorities

## Goal
Allow users to assign high, medium, or low priority to tasks.

## Acceptance Criteria
- Default priority = medium
- API accepts priority field
- Priority stored in DB
- Search & sort supports priority

## Validation Rules
- Allowed values: high, medium, low
- Invalid value → 400 error
📁 /specs/features/tags.md
# Feature Spec: Tags & Categories

## Goal
Allow users to tag tasks for better organization.

## Acceptance Criteria
- Tags stored as TEXT[]
- Users can filter by one or more tags
- Tags editable post-creation

## Validation
- Max 10 tags per task
- Each tag max 20 chars
📁 /specs/features/search-filter-sort.md
# Feature Spec: Search, Filter, and Sort

## Goal
Enable users to search and organize tasks efficiently.

## Acceptance Criteria
- Search by keyword in title/description
- Filter by status, priority, tag, due date range
- Sort by due date, priority, created date, title

## Performance
- Search results returned under 300ms for 10k tasks
📁 /specs/api/tasks-api.md
# API Spec: Tasks API (Phase V)

Base URL: /api/tasks

## POST /tasks
Creates a task.

Request:
{
  "title": "Weekly standup",
  "priority": "high",
  "due_date": "2026-02-03T10:00:00Z",
  "tags": ["work"],
  "recurrence": "weekly",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO;BYHOUR=10"
}

Response: 201 Created

Side Effects:
- Publishes task.created to Kafka via Dapr Pub/Sub
- If recurrence present, schedules reminder

---

## GET /tasks
Query params:
- search
- status
- priority
- tag
- sort
- due_from
- due_to

---

## PATCH /tasks/{id}
Updates task fields.

Side Effects:
- Publishes task.updated event

---

## POST /tasks/{id}/complete
Marks task complete.

Side Effects:
- Publishes task.completed
- Triggers recurrence flow

---

## DELETE /tasks/{id}
Deletes task.

Side Effects:
- Publishes task.deleted
📁 /specs/events/task-events.md
# Event Spec: Task Events

## Topics

task-events
- task.created
- task.updated
- task.completed
- task.deleted

reminders
- task.due_scheduled
- task.reminder_triggered

task-updates
- websocket.broadcast

## Event Envelope
{
  "event_id": "uuid",
  "type": "task.created",
  "timestamp": "ISO8601",
  "source": "todo-chat-api",
  "data": { ... }
}

## Guarantees
- At-least-once delivery
- Idempotent consumers
📁 /specs/services/todo-chat-api.md
# Service Spec: todo-chat-api

## Responsibility
- Handles user input via chat & REST
- Publishes all task lifecycle events
- Performs validation & auth

## Interfaces
- REST API
- Dapr Pub/Sub output binding

## Dependencies
- PostgreSQL via Dapr State
- Kafka via Dapr Pub/Sub
- Secrets via Dapr secretstore

## Scaling
- Stateless
- Horizontal pod autoscaling

## Failure Handling
- Retry publish on pubsub failure
- Circuit-break on DB errors
📁 /specs/services/recurring-task-service.md
# Service Spec: recurring-task-service

## Responsibility
- Consumes task.completed events
- Generates next task instance
- Publishes task.created

## Inputs
- Kafka topic: task-events

## Outputs
- Kafka topic: task-events

## Rules
- Must not duplicate if next_occurrence already exists
- Must preserve tags, priority, recurrence metadata

## Idempotency
- Event ID deduplication required
📁 /specs/services/notification-service.md
# Service Spec: notification-service

## Responsibility
- Consumes reminder events
- Sends notification (log/email/push)

## Inputs
- Kafka topic: reminders

## Outputs
- None

## SLA
- Reminder sent within ±5 seconds of due_date

## Failure Handling
- Retry 3 times
- Dead-letter topic on failure
📁 /specs/services/websocket-service.md
# Service Spec: websocket-service

## Responsibility
- Consumes task-updates events
- Broadcasts updates to connected clients

## Inputs
- Kafka topic: task-updates

## Outputs
- WebSocket events

## Guarantees
- Best-effort real-time delivery
📁 /specs/infra/dapr-components.md
# Infrastructure Spec: Dapr Components

## pubsub.yaml
- Component: Kafka / Redpanda
- Topics: task-events, reminders, task-updates

## state.yaml
- Component: PostgreSQL
- Key format: tasks:{id}

## bindings.yaml
- Component: cron
- Purpose: schedule reminders

## secretstore.yaml
- Component: env / cloud secret manager
📁 /specs/infra/kubernetes.md
# Infrastructure Spec: Kubernetes Deployment

## Environments
- Local: Minikube
- Cloud: Oracle OKE (Free Tier)

## Requirements
- Dapr sidecar injection enabled
- Helm charts per service
- NetworkPolicies enabled

## Resources
- All services stateless
- HPA enabled for todo-chat-api

## Observability
- Prometheus metrics
- Dapr dashboard enabled
📁 /specs/infra/ci-cd.md
# Infrastructure Spec: CI/CD Pipeline

## Trigger
- On push to main
- On PR merge

## Pipeline Stages
1. Lint
2. Test
3. Build Docker images
4. Push to registry
5. Helm upgrade on cluster

## Constraints
- No manual deployment
- Rollback on failure
📁 /specs/infra/event-driven-architecture.md
# Architecture Spec: Event-Driven System

## Backbone
Kafka via Dapr Pub/Sub

## Principles
- No service-to-service sync calls
- All state changes emit events
- Consumers idempotent

## Guarantees
- At-least-once delivery
- Eventually consistent
📁 /specs/features/realtime-sync.md
# Feature Spec: Real-Time Sync

## Goal
Ensure task changes reflect instantly across browser tabs/devices.

## Acceptance Criteria
- Task update emits task.updated
- websocket-service broadcasts update
- Client UI updates without refresh

## Latency Target
< 500ms"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Recurring Tasks (Priority: P1)

Users can create tasks that automatically regenerate based on recurrence rules (daily, weekly, custom) without manual duplication. For example, saying "add weekly meeting every Monday at 10am" will result in future tasks being auto-created.

**Why this priority**: This is the core functionality that differentiates the system from basic task management, providing significant value by automating repetitive task creation.

**Independent Test**: Can be fully tested by creating a recurring task and verifying that subsequent instances are automatically created upon completion of the previous instance, delivering the value of automated task repetition.

**Acceptance Scenarios**:

1. **Given** user wants to create a recurring task, **When** user specifies recurrence rule like "add weekly meeting every Monday at 10am", **Then** the system creates the initial task and schedules future occurrences
2. **Given** a recurring task exists, **When** the current instance is completed, **Then** the system automatically creates the next instance based on the recurrence rule

---

### User Story 2 - Set Due Date Reminders (Priority: P1)

Users can set due dates and times for tasks and receive notifications when the time arrives, enabling better time management and task completion.

**Why this priority**: Timely reminders are essential for task completion and user productivity, forming a core part of the enhanced task management system.

**Independent Test**: Can be fully tested by setting a due date and verifying that the user receives a notification at the specified time, delivering the value of proactive task awareness.

**Acceptance Scenarios**:

1. **Given** user creates a task with a due date, **When** the due date and time arrive, **Then** the system sends a reminder notification to the user
2. **Given** a reminder is scheduled, **When** the reminder delivery fails, **Then** the system retries the delivery according to the configured retry policy

---

### User Story 3 - Manage Task Priorities (Priority: P2)

Users can assign high, medium, or low priority levels to tasks to help organize and focus on important items, with the ability to search and sort by priority.

**Why this priority**: Priority management helps users focus on what matters most, improving task organization and productivity without being as fundamental as recurrence and reminders.

**Independent Test**: Can be fully tested by assigning priorities to tasks and verifying that they can be searched and sorted by priority level, delivering the value of organized task management.

**Acceptance Scenarios**:

1. **Given** user creates a task, **When** user assigns a priority (high/medium/low), **Then** the task is stored with the assigned priority
2. **Given** tasks with various priorities exist, **When** user sorts by priority, **Then** tasks are displayed in priority order

---

### User Story 4 - Tag and Categorize Tasks (Priority: P2)

Users can tag tasks with categories (work, personal, urgent, etc.) for better organization, with the ability to filter tasks by tags.

**Why this priority**: Tagging enables flexible organization and categorization of tasks, allowing users to group related items and find them easily.

**Independent Test**: Can be fully tested by tagging tasks and filtering by those tags, delivering the value of organized task categorization.

**Acceptance Scenarios**:

1. **Given** user creates a task, **When** user adds tags, **Then** the task is stored with the associated tags
2. **Given** tasks with various tags exist, **When** user filters by specific tags, **Then** only tasks with those tags are displayed

---

### User Story 5 - Search and Filter Tasks (Priority: P3)

Users can efficiently search and filter tasks by keyword, status, priority, tag, and due date range, with sorting capabilities by various criteria.

**Why this priority**: Advanced search and filtering capabilities enhance user productivity by enabling quick access to specific tasks, though this builds upon the core functionality.

**Independent Test**: Can be fully tested by performing searches and filters with various criteria, delivering the value of efficient task discovery.

**Acceptance Scenarios**:

1. **Given** multiple tasks exist, **When** user performs keyword search, **Then** tasks matching the keyword are returned within performance thresholds
2. **Given** tasks with various attributes exist, **When** user applies filters and sorting, **Then** tasks are displayed according to the applied criteria

---

### Edge Cases

- What happens when a recurrence rule is invalid or malformed? The system should reject the task creation with a 400 error.
- How does the system handle missing due dates for recurring tasks? Recurrence should be disabled when no due date is provided.
- What occurs when a user attempts to add more than 10 tags to a single task? The system should validate and reject with appropriate error messaging.
- How does the system handle failure to deliver a reminder notification? The system should retry delivery and eventually log to a dead-letter topic if persistent failure occurs.
- What happens when multiple services attempt to process the same event simultaneously? The system should ensure idempotency to prevent duplicate task creation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store recurring task rules in `tasks.recurrence` and `tasks.recurrence_rule` fields
- **FR-002**: System MUST automatically create the next task instance when a recurring task is completed
- **FR-003**: System MUST emit `task.completed` events to Kafka topic `task-events` when tasks are completed
- **FR-004**: System MUST consume `task.completed` events and generate new task instances based on recurrence rules
- **FR-005**: System MUST inherit title, tags, priority, and adjusted due date from the original recurring task
- **FR-006**: System MUST validate recurrence rules and reject invalid rules with 400 error
- **FR-007**: System MUST disable recurrence functionality when due date is missing
- **FR-008**: System MUST emit `task.due_scheduled` events when tasks with due dates are created
- **FR-009**: System MUST send reminder notifications when due dates arrive
- **FR-010**: System MUST store task priority as high, medium, or low with medium as default
- **FR-011**: System MUST store tags as an array of text values with validation limits
- **FR-012**: System MUST support searching tasks by keyword in title and description
- **FR-013**: System MUST support filtering tasks by status, priority, tags, and due date range
- **FR-014**: System MUST support sorting tasks by due date, priority, creation date, and title
- **FR-015**: System MUST emit task lifecycle events (created, updated, completed, deleted) to appropriate Kafka topics
- **FR-016**: System MUST provide at-least-once delivery guarantees for all events
- **FR-017**: System MUST ensure event consumers are idempotent to handle duplicate events
- **FR-018**: System MUST retry failed reminder deliveries up to 3 times before logging to dead-letter topic
- **FR-019**: System MUST validate tag count (max 10 per task) and tag length (max 20 characters each)

### Key Entities *(include if feature involves data)*

- **Task**: Represents a user's task with attributes including title, description, priority (high/medium/low), due date, tags (array), recurrence settings (rule, frequency), and completion status
- **RecurrenceRule**: Defines the pattern for recurring tasks including frequency (daily, weekly, custom), interval, and specific timing parameters
- **Event**: Represents system events for task lifecycle (created, updated, completed, deleted) and reminders (due_scheduled, reminder_triggered)
- **Notification**: Represents reminder notifications sent to users based on due dates and recurrence rules
- **Tag**: Represents categorical labels that can be applied to tasks for organization and filtering

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create recurring tasks with various recurrence patterns (daily, weekly, custom) and have subsequent instances automatically generated upon completion of the previous instance
- **SC-002**: Users receive reminder notifications within ±5 seconds of the scheduled due time for 95% of tasks with due dates
- **SC-003**: Task search and filter operations return results within 300ms for datasets containing up to 10,000 tasks
- **SC-004**: System processes task lifecycle events with at-least-once delivery guarantees and maintains idempotency to prevent duplicate processing
- **SC-005**: Users can successfully assign priorities (high/medium/low) and tags to tasks, and filter/sort by these attributes
- **SC-006**: Recurring task service handles event processing with 99% success rate and properly manages failed events through retry mechanisms
- **SC-007**: System maintains data integrity by preventing duplicate task creation and ensuring proper inheritance of attributes in recurring task sequences