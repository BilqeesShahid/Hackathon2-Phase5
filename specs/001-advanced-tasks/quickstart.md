# Quickstart Guide: Advanced Task Management

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (Minikube for local development)
- Dapr installed and configured
- Python 3.13+
- Node.js 18+ (for frontend, if applicable)

## Local Development Setup

### 1. Clone and Initialize

```bash
# Clone the repository
git clone <repo-url>
cd <repo-name>

# Install dependencies
pip install -r requirements.txt
```

### 2. Start Dapr and Infrastructure

```bash
# Initialize Dapr
dapr init

# Start infrastructure with Docker Compose
docker-compose -f docker/local-infra.yml up -d
# This starts:
# - PostgreSQL database
# - Kafka/Redpanda
# - Redis (if needed)
```

### 3. Set Up Environment Variables

Create `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/advanced_tasks
KAFKA_BROKERS=localhost:9092
DAPR_HTTP_ENDPOINT=http://localhost:3500
DAPR_GRPC_ENDPOINT=grpc://localhost:50001
JWT_SECRET_KEY=your-secret-key-here
```

### 4. Run Database Migrations

```bash
# Apply database schema changes
python -m database.migrate
```

### 5. Start Services

```bash
# Terminal 1: Start todo-chat-api with Dapr
dapr run --app-id todo-chat-api --app-port 8000 --dapr-http-port 3500 -- python -m todo_chat_api.main

# Terminal 2: Start recurring-task-service with Dapr
dapr run --app-id recurring-task-service --app-port 8001 --dapr-http-port 3501 -- python -m recurring_task_service.main

# Terminal 3: Start notification-service with Dapr
dapr run --app-id notification-service --app-port 8002 --dapr-http-port 3502 -- python -m notification_service.main

# Terminal 4: Start websocket-service with Dapr
dapr run --app-id websocket-service --app-port 8003 --dapr-http-port 3503 -- python -m websocket_service.main
```

## Kubernetes Deployment

### 1. Install Dapr in Kubernetes

```bash
# Add Dapr Helm repo
helm repo add dapr https://dapr.github.io/helm-charts
helm repo update

# Install Dapr
helm install dapr dapr/dapr \
  --namespace dapr-system \
  --create-namespace \
  --wait
```

### 2. Deploy Infrastructure

```bash
# Deploy Kafka/Redpanda
kubectl apply -f k8s/infra/kafka.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/infra/postgresql.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=kafka --timeout=300s
kubectl wait --for=condition=ready pod -l app=postgresql --timeout=300s
```

### 3. Deploy Services

```bash
# Deploy each service with Helm
helm install todo-chat-api ./helm/todo-chat-api
helm install recurring-task-service ./helm/recurring-task-service
helm install notification-service ./helm/notification-service
helm install websocket-service ./helm/websocket-service
```

## API Endpoints

### Task Management
```
POST   /api/tasks          # Create task with recurrence/priority/tags
GET    /api/tasks          # List tasks with filters
GET    /api/tasks/{id}     # Get specific task
PATCH  /api/tasks/{id}     # Update task
DELETE /api/tasks/{id}     # Delete task
POST   /api/tasks/{id}/complete  # Complete task (triggers recurrence)
```

### Query Parameters for GET /api/tasks
- `search`: Keyword search in title/description
- `status`: Filter by task status
- `priority`: Filter by priority (high/medium/low)
- `tag`: Filter by specific tag
- `sort`: Sort by (due_date, priority, created, title)
- `due_from`: Filter tasks with due date >= this date
- `due_to`: Filter tasks with due date <= this date

### Example Requests

```bash
# Create a recurring task
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "title": "Weekly team meeting",
    "priority": "high",
    "due_date": "2026-02-09T10:00:00Z",
    "tags": ["work", "meeting"],
    "recurrence": "weekly",
    "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO;BYHOUR=10"
  }'

# Search and filter tasks
curl "http://localhost:8000/api/tasks?search=meeting&priority=high&tag=work&sort=due_date" \
  -H "Authorization: Bearer <jwt-token>"
```

## Dapr Components

### Pub/Sub Configuration (dapr/components/pubsub.yaml)
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "localhost:9092"
  - name: consumerGroup
    value: "advanced-tasks-group"
  - name: authType
    value: "none"
```

### State Store Configuration (dapr/components/statestore.yaml)
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: postgresql-state
spec:
  type: state.postgresql
  version: v1
  metadata:
  - name: connectionString
    value: "host=localhost user=username password=password dbname=advanced_tasks port=5432"
  - name: versionColumnName
    value: "version"
  - name: metadataTableName
    value: "dapr_metadata"
```

## Testing

### Unit Tests
```bash
pytest tests/unit/
```

### Integration Tests
```bash
pytest tests/integration/
```

### Contract Tests
```bash
pytest tests/contract/
```

## Monitoring and Observability

- Dapr Dashboard: `http://localhost:8080`
- Application logs: Check individual service logs
- Kafka topics: Use `kafka-topics.sh` to inspect topic messages
- PostgreSQL: Connect directly to inspect data

## Troubleshooting

### Common Issues
1. **Dapr sidecar not starting**: Ensure Dapr is properly installed with `dapr status`
2. **Kafka connection errors**: Verify Kafka is running and accessible
3. **Database migration failures**: Check database connectivity and permissions
4. **Event processing delays**: Check Kafka consumer groups and service health

### Useful Commands
```bash
# Check Dapr sidecars
dapr status

# Inspect Kafka topics
dapr components pubsub

# View service logs
dapr logs <app-id>
```