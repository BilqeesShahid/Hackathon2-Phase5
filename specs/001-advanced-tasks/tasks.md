# Implementation Tasks: Advanced Task Management

**Feature**: Advanced Task Management (Recurring Tasks, Due Date Reminders, Priorities, Tags, Search/Filter)
**Branch**: `001-advanced-tasks`
**Created**: 2026-02-03
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Implementation Strategy

Build an event-driven microservices architecture with Kafka and Dapr to implement advanced task management features. Start with foundational components, then implement user stories in priority order (P1, P2, P3). Each user story should be independently testable and deliver value.

## Dependencies

- User Story 2 (Due Date Reminders) depends on foundational event publishing from User Story 1 (Recurring Tasks)
- User Story 5 (Search & Filter) builds on all previous user stories
- All services depend on foundational Dapr components and database schema

## Parallel Execution Examples

- While developing the todo-chat-api, the recurring-task-service can be developed in parallel
- While implementing the notification-service, the websocket-service can be developed in parallel
- Database migrations can be prepared in parallel with service development

---

## Phase 1: Setup & Project Initialization

- [ ] T001 Create project structure per implementation plan in backend/todo-chat-api/
- [ ] T002 Create project structure per implementation plan in backend/recurring-task-service/
- [ ] T003 Create project structure per implementation plan in backend/notification-service/
- [ ] T004 Create project structure per implementation plan in backend/websocket-service/
- [ ] T005 [P] Create dapr/components/ directory and basic component files
- [ ] T006 [P] Create helm/ directory with basic chart structures for all services
- [ ] T007 [P] Create database/migrations/ directory structure
- [ ] T008 [P] Create contracts/ directory and copy openapi.yaml
- [ ] T009 [P] Set up requirements.txt files for all Python services
- [ ] T010 [P] Initialize git repository with proper .gitignore for all components

---

## Phase 2: Foundational Components

- [ ] T011 Create database migration for extended tasks table in database/migrations/001_extend_tasks_table.sql
- [ ] T012 Create database migration for events table in database/migrations/002_create_events_table.sql
- [ ] T013 Create database migration for notifications table in database/migrations/003_create_notifications_table.sql
- [ ] T014 [P] Create base models for Task entity in backend/todo-chat-api/src/models/task.py
- [ ] T015 [P] Create base models for Event entity in backend/todo-chat-api/src/models/event.py
- [ ] T016 [P] Create base models for Notification entity in backend/notification-service/src/models/notification.py
- [ ] T017 [P] Create base models for RecurrenceRule entity in backend/todo-chat-api/src/models/recurrence_rule.py
- [ ] T018 [P] Set up SQLModel database connection in backend/todo-chat-api/src/database/connection.py
- [ ] T019 [P] Set up Dapr client integration in backend/todo-chat-api/src/dapr/client.py
- [ ] T020 [P] Set up Dapr client integration in backend/recurring-task-service/src/dapr/client.py
- [ ] T021 [P] Set up Dapr client integration in backend/notification-service/src/dapr/client.py
- [ ] T022 [P] Set up Dapr client integration in backend/websocket-service/src/dapr/client.py
- [ ] T023 Set up Kafka/Dapr pubsub component configuration in dapr/components/pubsub.yaml
- [ ] T024 Set up PostgreSQL/Dapr state component configuration in dapr/components/state.yaml
- [ ] T025 Set up cron bindings component configuration in dapr/components/bindings.yaml
- [ ] T026 Set up secret store component configuration in dapr/components/secretstores.yaml

---

## Phase 3: [US1] Create Recurring Tasks

**Goal**: Enable users to create tasks that automatically regenerate based on recurrence rules without manual duplication.

**Independent Test Criteria**: Can create a recurring task and verify that subsequent instances are automatically created upon completion of the previous instance.

- [ ] T027 [P] [US1] Create TaskService with recurrence logic in backend/todo-chat-api/src/services/task_service.py
- [ ] T028 [P] [US1] Implement recurrence rule validation in backend/todo-chat-api/src/services/recurrence_validator.py
- [ ] T029 [US1] Create API endpoint for creating tasks with recurrence in backend/todo-chat-api/src/api/tasks.py
- [ ] T030 [US1] Implement event publishing for task.created in backend/todo-chat-api/src/api/tasks.py
- [ ] T031 [US1] Implement event publishing for task.completed when recurrence exists in backend/todo-chat-api/src/api/tasks.py
- [ ] T032 [P] [US1] Create RecurringTaskProcessor in backend/recurring-task-service/src/consumers/task_completed_consumer.py
- [ ] T033 [P] [US1] Implement logic to calculate next occurrence in backend/recurring-task-service/src/services/recurring_task_service.py
- [ ] T034 [P] [US1] Create event handler for task.completed events in backend/recurring-task-service/src/main.py
- [ ] T035 [P] [US1] Implement duplicate prevention logic in backend/recurring-task-service/src/services/recurring_task_service.py
- [ ] T036 [US1] Add recurrence fields to Task model in backend/todo-chat-api/src/models/task.py
- [ ] T037 [US1] Test recurring task creation with weekly pattern in tests/integration/test_recurring_tasks.py
- [ ] T038 [US1] Test recurring task completion triggering next instance in tests/integration/test_recurring_tasks.py

---

## Phase 4: [US2] Set Due Date Reminders

**Goal**: Allow users to set due dates and times for tasks and receive notifications when the time arrives.

**Independent Test Criteria**: Can set a due date and verify that the user receives a notification at the specified time.

- [ ] T039 [P] [US2] Extend Task model to include due_date field in backend/todo-chat-api/src/models/task.py
- [ ] T040 [P] [US2] Create ReminderScheduler service in backend/todo-chat-api/src/services/reminder_scheduler.py
- [ ] T041 [P] [US2] Implement event publishing for task.due_scheduled in backend/todo-chat-api/src/api/tasks.py
- [ ] T042 [P] [US2] Create ReminderConsumer in backend/notification-service/src/consumers/reminder_consumer.py
- [ ] T043 [P] [US2] Implement notification sending logic in backend/notification-service/src/services/notification_service.py
- [ ] T044 [P] [US2] Create NotificationProvider for different channels in backend/notification-service/src/providers/base_provider.py
- [ ] T045 [P] [US2] Implement retry mechanism for failed notifications in backend/notification-service/src/services/notification_service.py
- [ ] T046 [US2] Add reminder scheduling to task creation endpoint in backend/todo-chat-api/src/api/tasks.py
- [ ] T047 [US2] Create dead letter queue handling for failed notifications in backend/notification-service/src/consumers/reminder_consumer.py
- [ ] T048 [US2] Test due date reminder scheduling in tests/integration/test_reminders.py
- [ ] T049 [US2] Test notification delivery and retry mechanism in tests/integration/test_reminders.py

---

## Phase 5: [US3] Manage Task Priorities

**Goal**: Allow users to assign high, medium, or low priority levels to tasks and search/sort by priority.

**Independent Test Criteria**: Can assign priorities to tasks and verify that they can be searched and sorted by priority level.

- [ ] T050 [P] [US3] Extend Task model to include priority field in backend/todo-chat-api/src/models/task.py
- [ ] T051 [P] [US3] Update TaskService to handle priority in backend/todo-chat-api/src/services/task_service.py
- [ ] T052 [P] [US3] Add priority validation to CreateTaskRequest in backend/todo-chat-api/src/api/tasks.py
- [ ] T053 [US3] Add priority field to task creation and update endpoints in backend/todo-chat-api/src/api/tasks.py
- [ ] T054 [US3] Implement priority-based sorting in task listing endpoint in backend/todo-chat-api/src/api/tasks.py
- [ ] T055 [US3] Add priority filtering to task listing endpoint in backend/todo-chat-api/src/api/tasks.py
- [ ] T056 [US3] Update database schema to include priority column in database/migrations/004_add_priority_column.sql
- [ ] T057 [US3] Test priority assignment and retrieval in tests/unit/test_task_priorities.py
- [ ] T058 [US3] Test priority-based sorting and filtering in tests/integration/test_task_filters.py

---

## Phase 6: [US4] Tag and Categorize Tasks

**Goal**: Allow users to tag tasks with categories for better organization and filter tasks by tags.

**Independent Test Criteria**: Can tag tasks and filter by those tags.

- [ ] T059 [P] [US4] Extend Task model to include tags field in backend/todo-chat-api/src/models/task.py
- [ ] T060 [P] [US4] Add tags validation to CreateTaskRequest in backend/todo-chat-api/src/api/tasks.py
- [ ] T061 [P] [US4] Implement tag validation logic (max 10 tags, max 20 chars each) in backend/todo-chat-api/src/services/task_service.py
- [ ] T062 [US4] Add tags field to task creation and update endpoints in backend/todo-chat-api/src/api/tasks.py
- [ ] T063 [US4] Implement tag-based filtering in task listing endpoint in backend/todo-chat-api/src/api/tasks.py
- [ ] T064 [US4] Update database schema to support tags array in database/migrations/005_add_tags_column.sql
- [ ] T065 [US4] Create GIN index for tags in database/migrations/006_add_tags_index.sql
- [ ] T066 [US4] Test tag assignment and validation in tests/unit/test_task_tags.py
- [ ] T067 [US4] Test tag-based filtering in tests/integration/test_task_filters.py

---

## Phase 7: [US5] Search and Filter Tasks

**Goal**: Enable users to search and filter tasks by keyword, status, priority, tag, and due date range with sorting capabilities.

**Independent Test Criteria**: Can perform searches and filters with various criteria.

- [ ] T068 [P] [US5] Implement keyword search functionality in backend/todo-chat-api/src/services/task_service.py
- [ ] T069 [P] [US5] Implement combined filtering logic (status, priority, tags, due date range) in backend/todo-chat-api/src/services/task_service.py
- [ ] T070 [P] [US5] Implement sorting functionality (by due date, priority, created, title) in backend/todo-chat-api/src/services/task_service.py
- [ ] T071 [US5] Add search and filter parameters to task listing endpoint in backend/todo-chat-api/src/api/tasks.py
- [ ] T072 [US5] Add sort parameter to task listing endpoint in backend/todo-chat-api/src/api/tasks.py
- [ ] T073 [US5] Optimize database queries with appropriate indexes in database/migrations/007_optimize_search_indexes.sql
- [ ] T074 [US5] Implement pagination for large result sets in backend/todo-chat-api/src/api/tasks.py
- [ ] T075 [US5] Test search functionality with various keywords in tests/integration/test_task_search.py
- [ ] T076 [US5] Test combined filtering with multiple criteria in tests/integration/test_task_filters.py
- [ ] T077 [US5] Test sorting functionality with different fields in tests/integration/test_task_sorting.py
- [ ] T078 [US5] Test performance with 10k+ tasks to ensure 300ms threshold in tests/performance/test_search_performance.py

---

## Phase 8: Cross-Cutting & Polish

- [ ] T079 Create websocket service for real-time updates in backend/websocket-service/src/ws/websocket_handler.py
- [ ] T080 Implement event broadcasting to websocket clients in backend/websocket-service/src/consumers/task_updates_consumer.py
- [ ] T081 Add authentication middleware to all services using JWT in backend/*/src/middleware/auth.py
- [ ] T082 Implement proper error handling and logging across all services in backend/*/src/utils/logger.py
- [ ] T083 Add metrics collection for recurring tasks created in backend/recurring-task-service/src/utils/metrics.py
- [ ] T084 Add metrics collection for reminder sent in backend/notification-service/src/utils/metrics.py
- [ ] T085 Create Helm charts for all services in helm/todo-chat-api/, helm/recurring-task-service/, helm/notification-service/, helm/websocket-service/
- [ ] T086 Create Dockerfiles for all services in backend/*/Dockerfile
- [ ] T087 Set up CI/CD pipeline configuration in .github/workflows/deploy.yml
- [ ] T088 Write comprehensive API documentation based on OpenAPI spec
- [ ] T089 Conduct end-to-end testing of all user stories in tests/e2e/test_advanced_tasks.py
- [ ] T090 Performance testing and optimization to meet 300ms search threshold