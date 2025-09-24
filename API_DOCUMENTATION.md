# Astral Planner API Documentation

## Overview

The Astral Planner API provides comprehensive endpoints for managing tasks, goals, habits, templates, and user data. All endpoints require authentication via Clerk JWT tokens.

## Base URL
```
Production: https://astralplanner.com/api
Development: http://localhost:3000/api
```

## Authentication

All API requests must include a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

## Rate Limiting

The API implements rate limiting per user:
- Default: 60 requests per minute
- AI endpoints: 10 requests per minute  
- Auth endpoints: 5 requests per 15 minutes
- Export endpoints: 5 requests per 5 minutes
- Webhook endpoints: 10 requests per second

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": { // For paginated endpoints
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }, // Optional additional error details
  "code": "ERROR_CODE"
}
```

## Endpoints

### Authentication

#### POST /api/auth/webhook
Clerk webhook for user management events.

**Request Body:**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

### Tasks

#### GET /api/tasks
Retrieve user's tasks with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (`todo`, `in_progress`, `completed`, `cancelled`)
- `priority` (string): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `workspace` (string): Filter by workspace ID
- `search` (string): Search in title and description
- `tags` (string): Comma-separated tags
- `due_date` (string): Filter by due date range (`overdue`, `today`, `tomorrow`, `week`)
- `sort` (string): Sort order (`created_at`, `updated_at`, `due_date`, `priority`, `title`)
- `order` (string): Sort direction (`asc`, `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "title": "Complete project documentation",
        "description": "Write comprehensive docs",
        "type": "task",
        "status": "in_progress",
        "priority": "high",
        "dueDate": "2024-12-31T23:59:59Z",
        "startDate": null,
        "estimatedHours": 4,
        "actualHours": 2,
        "tags": ["documentation", "project"],
        "workspaceId": "workspace_123",
        "createdBy": "user_123",
        "assignedTo": null,
        "position": 0,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-02T00:00:00Z",
        "completedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "type": "task",
  "workspaceId": "workspace_123",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2024-12-31T23:59:59Z",
  "estimatedHours": 2,
  "tags": ["urgent", "client"],
  "assignedTo": "user_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_124",
    "title": "New Task",
    // ... full task object
  },
  "message": "Task created successfully"
}
```

#### GET /api/tasks/[id]
Get a specific task by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "title": "Complete project documentation",
    // ... full task object with relations
    "workspace": {
      "id": "workspace_123",
      "name": "Work Projects"
    },
    "creator": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe"
    },
    "activities": [
      {
        "id": "activity_1",
        "action": "updated",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2024-01-02T00:00:00Z",
        "metadata": {
          "changes": {
            "status": {
              "from": "todo",
              "to": "in_progress"
            }
          }
        }
      }
    ]
  }
}
```

#### PATCH /api/tasks/[id]
Update a task.

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "status": "completed",
  "priority": "high",
  "actualHours": 3
}
```

#### DELETE /api/tasks/[id]
Delete or archive a task.

**Query Parameters:**
- `permanent` (boolean): Permanently delete (default: false, soft delete)

---

### Goals

#### GET /api/goals
Retrieve user's goals.

**Query Parameters:**
- `status` (string): Filter by status (`active`, `completed`, `paused`, `cancelled`)
- `category` (string): Filter by category
- `type` (string): Filter by type (`lifetime`, `yearly`, `quarterly`, `monthly`, `weekly`, `daily`)

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal_123",
        "title": "Launch MVP",
        "description": "Successfully launch minimum viable product",
        "type": "quarterly",
        "category": "business",
        "status": "active",
        "priority": "high",
        "targetValue": 100,
        "currentValue": 75,
        "unit": "%",
        "targetDate": "2024-03-31T23:59:59Z",
        "milestones": [
          {
            "title": "Complete core features",
            "completed": true
          },
          {
            "title": "Beta testing",
            "completed": false
          }
        ],
        "progress": [
          {
            "date": "2024-01-15T00:00:00Z",
            "value": 50,
            "notes": "Completed user authentication"
          }
        ]
      }
    ]
  }
}
```

#### POST /api/goals
Create a new goal.

**Request Body:**
```json
{
  "title": "New Goal",
  "description": "Goal description",
  "type": "yearly",
  "category": "personal",
  "targetValue": 100,
  "currentValue": 0,
  "unit": "points",
  "targetDate": "2024-12-31T23:59:59Z",
  "milestones": [
    {
      "title": "First milestone",
      "completed": false
    }
  ]
}
```

---

### Habits

#### GET /api/habits
Retrieve user's habits.

**Query Parameters:**
- `active` (boolean): Filter by active status
- `frequency` (string): Filter by frequency (`daily`, `weekly`, `custom`)

**Response:**
```json
{
  "success": true,
  "data": {
    "habits": [
      {
        "id": "habit_123",
        "name": "Morning Meditation",
        "description": "10 minutes of mindfulness",
        "frequency": "daily",
        "targetCount": 1,
        "currentStreak": 12,
        "bestStreak": 21,
        "completionRate": 0.85,
        "color": "#3B82F6",
        "icon": "🧘",
        "reminderTime": "07:00",
        "isActive": true,
        "entries": [
          {
            "date": "2024-01-15T00:00:00Z",
            "completed": true,
            "value": 1,
            "notes": "Great session today"
          }
        ]
      }
    ]
  }
}
```

#### POST /api/habits
Create a new habit.

**Request Body:**
```json
{
  "name": "Evening Reading",
  "description": "Read for 30 minutes",
  "frequency": "daily",
  "targetCount": 1,
  "color": "#10B981",
  "icon": "📚",
  "reminderTime": "20:00"
}
```

#### POST /api/habits/[id]/entries
Log a habit entry.

**Request Body:**
```json
{
  "date": "2024-01-15T00:00:00Z",
  "completed": true,
  "value": 1,
  "notes": "Completed successfully"
}
```

---

### Templates

#### GET /api/templates
Retrieve available templates.

**Query Parameters:**
- `category` (string): Filter by category
- `public` (boolean): Include public templates
- `my` (boolean): Only user's templates

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "GTD Weekly Review",
        "description": "Getting Things Done weekly review template",
        "category": "productivity",
        "content": {
          "tasks": [
            "Clear inbox to zero",
            "Review calendar for next week"
          ],
          "structure": "checklist"
        },
        "tags": ["gtd", "weekly", "review"],
        "isPublic": true,
        "isPremium": false,
        "usageCount": 45,
        "rating": 4.5
      }
    ]
  }
}
```

#### POST /api/templates/[id]/use
Use a template to create tasks/goals.

**Request Body:**
```json
{
  "workspaceId": "workspace_123",
  "customizations": {
    "dueDate": "2024-01-31T23:59:59Z",
    "priority": "medium"
  }
}
```

---

### AI Features

#### POST /api/ai/suggestions
Generate AI-powered suggestions.

**Request Body:**
```json
{
  "type": "tasks",
  "context": {
    "userGoals": ["Launch business", "Improve fitness"],
    "workContext": "Software development",
    "preferences": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Review and prioritize current projects",
      "description": "Evaluate ongoing projects and adjust priorities",
      "priority": "medium",
      "estimatedHours": 1,
      "category": "planning",
      "tags": ["review", "planning"]
    }
  ]
}
```

#### POST /api/ai/suggestions (Goal Breakdown)
Break down a goal into actionable items.

**Request Body:**
```json
{
  "type": "goal-breakdown",
  "context": {
    "goalTitle": "Launch Online Store",
    "goalDescription": "Create and launch e-commerce website",
    "deadline": "2024-06-30"
  }
}
```

---

### Analytics

#### GET /api/analytics/dashboard
Get dashboard analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTasks": 156,
      "completedTasks": 89,
      "completionRate": 0.57,
      "activeGoals": 8,
      "activeHabits": 5
    },
    "productivity": {
      "weeklyProgress": [65, 78, 82, 75, 90, 85, 88],
      "topCategories": [
        {"name": "Work", "count": 45},
        {"name": "Personal", "count": 23}
      ]
    },
    "habits": {
      "streaks": [
        {"name": "Meditation", "streak": 12},
        {"name": "Exercise", "streak": 8}
      ]
    }
  }
}
```

---

### Export

#### GET /api/export
Export user data.

**Query Parameters:**
- `format` (string): Export format (`json`, `csv`)
- `type` (string): Data type (`tasks`, `goals`, `habits`, `all`)
- `date_range` (string): Date range (`week`, `month`, `quarter`, `year`, `all`)

**Response:**
- JSON format: Returns structured data
- CSV format: Returns CSV file download

---

### Admin (Admin users only)

#### GET /api/admin/stats
Get system statistics.

#### GET /api/admin/users
List all users with pagination.

#### GET /api/admin/health
System health check.

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Webhooks

### Clerk User Events

The API handles Clerk webhook events for user lifecycle management:

- `user.created` - Creates user record in database
- `user.updated` - Updates user information
- `user.deleted` - Handles user deletion

**Webhook URL:** `https://astralplanner.com/api/auth/webhook`

## SDK Examples

### JavaScript/Node.js

```javascript
const API_BASE = 'https://astralplanner.com/api'
const token = 'your-jwt-token'

// Get tasks
const response = await fetch(`${API_BASE}/tasks`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const data = await response.json()

// Create task
const newTask = await fetch(`${API_BASE}/tasks`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Task',
    description: 'Task description',
    workspaceId: 'workspace_123'
  })
})
```

### Python

```python
import requests

API_BASE = 'https://astralplanner.com/api'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get tasks
response = requests.get(f'{API_BASE}/tasks', headers=headers)
data = response.json()

# Create task
new_task = requests.post(f'{API_BASE}/tasks', 
    headers=headers,
    json={
        'title': 'New Task',
        'description': 'Task description',
        'workspaceId': 'workspace_123'
    }
)
```

### cURL

```bash
# Get tasks
curl -H "Authorization: Bearer your-jwt-token" \
     https://astralplanner.com/api/tasks

# Create task
curl -X POST \
     -H "Authorization: Bearer your-jwt-token" \
     -H "Content-Type: application/json" \
     -d '{"title":"New Task","workspaceId":"workspace_123"}' \
     https://astralplanner.com/api/tasks
```

## Versioning

The API uses semantic versioning. Current version is `v1`. Version is included in response headers:

```
API-Version: v1
```

## Support

For API support, please contact:
- Email: api-support@astralplanner.com
- Documentation: https://docs.astralplanner.com
- Status Page: https://status.astralplanner.com