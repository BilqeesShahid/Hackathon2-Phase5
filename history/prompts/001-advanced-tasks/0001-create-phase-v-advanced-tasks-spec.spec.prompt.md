---
id: 0001
title: Create Phase V Advanced Tasks Spec
stage: spec
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-advanced-tasks
branch: 001-advanced-tasks
user: SHAHID
command: /sp.specify
labels: ["spec", "phase-v", "advanced-tasks", "recurring-tasks", "event-driven"]
links:
  spec: "../spec.md"
  ticket: null
  adr: null
  pr: null
files:
  - "specs/001-advanced-tasks/spec.md"
  - "specs/001-advanced-tasks/checklists/requirements.md"
  - ".specify/memory/constitution.md"
tests:
  - "none"
---

## Prompt

for phase 5 # Feature Spec: Recurring Tasks

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
< 500ms

## Response snapshot

Successfully created comprehensive feature specification for Phase V advanced task management including recurring tasks, due date reminders, priorities, tags, and search/filter capabilities. Created new branch 001-advanced-tasks and documented all requirements with user stories, functional requirements, and success criteria.

## Outcome

- ✅ Impact: Created complete feature specification for Phase V advanced task management system with recurring tasks, due date reminders, priorities, tags, and search/filter capabilities
- 🧪 Tests: none
- 📁 Files: specs/001-advanced-tasks/spec.md, specs/001-advanced-tasks/checklists/requirements.md, .specify/memory/constitution.md
- 🔁 Next prompts: /sp.plan to create implementation plan, /sp.tasks to break down implementation tasks
- 🧠 Reflection: Successfully transformed complex feature requirements into a comprehensive, testable specification following the template structure

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
