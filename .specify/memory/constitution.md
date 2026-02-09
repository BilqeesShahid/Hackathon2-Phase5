# Phase V Constitution – Advanced Cloud Deployment
**Hackathon II: Evolution of Todo**

## 1. Phase Goal
Transform the Phase III/IV Todo AI Chatbot into a **production-grade, event-driven, cloud-native distributed system** using:
- Full Advanced + Intermediate features
- Kafka (event-driven backbone)
- Dapr (sidecar for Pub/Sub, State, Bindings, Secrets, Service Invocation)
- Kubernetes (first Minikube, then AKS/GKE/Oracle OKE)
- CI/CD + monitoring

**Constraint**: All changes must be spec-driven via Claude Code + Spec-Kit Plus. No manual code edits.

## 2. Feature Scope (Must Implement)

### Advanced Level (Intelligent Features)
- Recurring Tasks (e.g. "weekly meeting every Monday at 10 AM" → auto-create next instance)
- Due Dates & Time Reminders (date/time picker in UI + browser notifications + scheduled events)

### Intermediate Level (Organization & Usability)
- Priorities (high/medium/low)
- Tags/Categories (work, personal, urgent, etc.)
- Search & Filter (keyword, status, priority, due date, tag)
- Sort Tasks (due date, priority, title, created)

### Architecture & Infrastructure
- Event-driven architecture with Kafka (task-events, reminders, task-updates topics)
- Dapr sidecar for all external dependencies (Pub/Sub → Kafka/Redpanda, State → Neon/Postgres, Bindings → cron reminders, Secrets)
- Stateless services wherever possible

## 3. Database Schema Extensions (tasks table)

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS
  priority      TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  due_date      TIMESTAMPTZ,
  tags          TEXT[],           -- array of strings
  recurrence    TEXT,             -- e.g. "weekly", "daily", "custom:every 2 weeks"
  recurrence_rule TEXT,           -- iCalendar RRULE or simple string
  next_occurrence TIMESTAMPTZ;
```

## 4. Kafka Topics (Dapr Pub/Sub components)

| Topic | Producer | Consumers | Purpose |
|-------|----------|-----------|---------|
| task-events | Chat API / MCP tools | recurring-service, audit-service | All CRUD + complete events |
| reminders | Chat API (when due_date set) | notification-service | Scheduled reminders |
| task-updates | Chat API | websocket-service | Real-time sync across clients |

## 5. Dapr Components (to be placed in dapr/components/)

- pubsub.yaml → Kafka/Redpanda
- state.yaml → Neon Postgres (or Dapr state store)
- bindings.yaml → cron (for reminders)
- secretstores.yaml → Azure Key Vault / Google Secret Manager / env

## 6. Services (new or extended)

- todo-chat-api (existing FastAPI + MCP + OpenAI Agents) → now publishes to Dapr Pub/Sub
- recurring-task-service (new Python/FastAPI) → consumes task-events, creates next occurrence
- notification-service (new) → consumes reminders, sends push/email (or just logs for hackathon)
- websocket-service (optional but recommended) → real-time updates

## 7. Deployment Targets
### Part B – Local (Minikube)

- Minikube + Dapr (full mode)
- Helm charts for all services + Dapr components
- Redpanda or Strimzi Kafka inside cluster

### Part C – Cloud

- Oracle OKE (always-free tier)
- Dapr on cluster
- Redpanda Cloud Serverless (free tier) or Confluent/Strimzi
- GitHub Actions CI/CD (build → test → helm upgrade)
- Basic monitoring (kubectl-ai + Prometheus or Azure Monitor)

## 8. Spec-Driven Workflow Reminder
Every change follows:

1. Update or create spec in /specs/features/, /specs/api/, /specs/infra/
2. Reference in Claude Code: @specs/features/recurring-tasks.md implement using Dapr Pub/Sub
3. Iterate until output matches acceptance criteria

## 9. Deliverables (Phase V)

- Updated monorepo with new services, Dapr components, Helm charts
- specs/ folder containing all new feature + infra specs
- GitHub Actions workflow
- README + demo video showing:
  - Recurring task creation via chat ("add weekly standup every Monday 10am")
  - Due date reminder triggering
  - Real-time update across two browser tabs
  - Kubernetes dashboard + Dapr dashboard screenshots

## 10. Governing Principles

### 10.1 Spec-Driven Development Is Mandatory

All implementation MUST originate from written specifications.

- No feature may be implemented without an approved spec
- Claude Code MUST be the sole code-generation agent
- Manual code writing is strictly prohibited
- Incorrect behavior MUST be fixed by refining the specification, never the code

---

### 10.2 Constitution → Specs → Code (Strict Hierarchy)

The development hierarchy is immutable:

1. **Constitution** — Governing laws
2. **Specifications** — What to build and how it behaves
3. **Claude Code Output** — Generated implementation

If generated code violates this Constitution or any approved specification, the **specification must be corrected**, not the implementation.

---

### 10.3 Event-Driven Architecture (NEW)

All services MUST communicate through **event-driven patterns** using Kafka/Dapr.

- Services MUST be stateless where possible
- All state changes MUST be published as events
- Event sourcing patterns encouraged where appropriate
- Direct service-to-service calls are discouraged in favor of pub/sub

---

### 10.4 Dapr Sidecar Pattern (NEW)

All external dependencies MUST be accessed through Dapr sidecars.

- No direct database connections from application code
- All pub/sub operations through Dapr
- All secret access through Dapr
- All service invocation through Dapr (if needed)
- Configuration management through Dapr

---

### 10.5 Microservice Design (NEW)

Services MUST be designed with loose coupling and high cohesion.

- Each service has a single responsibility
- Services communicate asynchronously where possible
- Services are independently deployable
- Services maintain their own data (eventual consistency acceptable)

---

## 11. Technology Mandates

### 11.1 Infrastructure

- **Kubernetes** (Minikube locally, Oracle OKE in cloud)
- **Dapr** for distributed system primitives
- **Kafka/Redpanda** for event streaming
- **Helm** for packaging and deployment
- **GitHub Actions** for CI/CD

### 11.2 Backend Services

- Python **FastAPI** for all services
- **SQLModel** for database interactions (Neon PostgreSQL)
- **OpenAI Agents SDK** for AI capabilities
- **MCP SDK** for system operations

### 11.3 Database

- **Neon Serverless PostgreSQL** for persistent storage
- Dapr state store component for state management
- Schema extensions as defined in Section 3

### 11.4 Dapr Components

- Pub/Sub component (Kafka/Redpanda)
- State store component (PostgreSQL)
- Secret store component (environment/Azure Key Vault)
- Binding components (cron for reminders)

---

## 12. Security & Authentication Constitution

### 12.1 Authentication Is Mandatory

- All services MUST require authentication
- Anonymous access is prohibited
- JWT tokens MUST be validated by all services

### 12.2 Dapr Security

- Dapr components MUST be properly secured
- Secret stores MUST be used for sensitive data
- Service invocation MUST be authenticated
- Component configurations MUST not expose secrets

---

## 13. Architecture Laws

### 13.1 Event-Driven Architecture (Required)

The system MUST follow this architecture:

```
Frontend (OpenAI ChatKit)
    ↓
Chat API (FastAPI /api/{user_id}/chat)
    ↓
Dapr Sidecar (Pub/Sub, State)
    ↓
Kafka (Event Streaming)
    ↓
Event Consumers (recurring-task-service, notification-service, etc.)
    ↓
Dapr Sidecar (State, Secrets)
    ↓
Database (Neon PostgreSQL)
```

### 13.2 Service Communication Rules

- All inter-service communication via Dapr pub/sub
- No direct HTTP calls between services
- Event-driven patterns for asynchronous operations
- Synchronous calls only when absolutely necessary via Dapr service invocation

---

## 14. Specification Requirements

Phase V MUST include specifications for:

- Constitution (this document)
- Feature specifications for recurring tasks, due dates, priorities, tags, etc.
- Infrastructure specifications for Kubernetes, Dapr, Kafka
- Service specifications for each microservice
- Dapr component specifications
- Helm chart specifications
- CI/CD pipeline specifications

All specifications MUST:

- Be written in Markdown
- Be human-readable
- Be explicitly referenced when invoking Claude Code
- Define service boundaries and responsibilities
- Specify event schemas and contracts

---

## 15. Claude Code Usage Law

Claude Code MUST:

- Read relevant specifications before generating code
- Design distributed services architecture first
- Implement Dapr integration patterns
- Respect all architectural and security constraints
- Never invent features not defined in specifications
- **NEVER create tight coupling between services**
- **ALWAYS use Dapr for external dependencies**

If ambiguity exists, Claude Code MUST stop and request specification clarification.

---

## 16. Forbidden Patterns 🚨

The following are **STRICTLY PROHIBITED**:

❌ Direct database access from application code
❌ Tight coupling between services
❌ Hardcoded service endpoints
❌ Synchronous service-to-service calls without Dapr
❌ Exposing secrets in configuration
❌ Violating event-driven architecture principles

---

## 17. Required Deliverables (Phase V)

A valid Phase V submission MUST include:

- Public GitHub repository
- Phase V Constitution file (this document)
- `/specs` directory with:
  - Feature specifications
  - Infrastructure specifications
  - Service specifications
  - Dapr component specifications
  - Helm chart specifications
- Working microservices with Dapr integration
- Kafka/Redpanda event streaming
- Kubernetes deployment manifests
- Dapr component configurations
- GitHub Actions CI/CD workflow
- Updated database schema with new columns
- Working frontend that integrates with event-driven backend
- Documentation and demo materials

---

## 18. Evaluation Criteria

Phase V submissions are evaluated on:

- Adherence to Event-Driven Architecture
- Correct Dapr integration patterns
- Proper microservice design
- Kubernetes deployment success
- Kafka/Redpanda event streaming implementation
- Feature completeness (recurring tasks, due dates, etc.)
- Specification completeness and clarity
- Proper use of Claude Code without manual coding
- Production readiness of the solution

---

## 19. Behavioral Guarantees

The system MUST:

- Process recurring tasks correctly via event-driven patterns
- Send timely reminders based on due dates
- Maintain data consistency across services
- Handle failures gracefully with retry mechanisms
- Scale appropriately with load
- Maintain security and user isolation across services

---

## 20. Non-Negotiable Rule

> **If it is not specified, it must not be implemented.**
> **If it is incorrect, the specification must be fixed — never the code.**
> **Event-driven, Dapr-enabled architecture is mandatory — no shortcuts.**

---

**Version**: 5.0.0 | **Ratified**: 2026-02-03 | **Phase**: V — Advanced Cloud Deployment (Event-Driven, Dapr, Kafka, Kubernetes)
