# Real-time Features Documentation

## Overview

The Ultimate Digital Planner now includes comprehensive real-time features powered by Pusher, enabling live collaboration, presence awareness, and instant updates across all users.

## Features Implemented

### 1. Real-time Data Synchronization
- **Task Updates**: Live updates when tasks are created, updated, or completed
- **Goal Progress**: Real-time goal progress synchronization
- **Habit Tracking**: Instant habit completion updates
- **Calendar Events**: Live calendar event synchronization

### 2. Presence Awareness
- **Online Users**: See who's currently active in your workspace
- **User Avatars**: Visual indicators of online collaborators
- **Activity Status**: Shows when users are typing or making changes
- **Connection Status**: Real-time connection indicators

### 3. Collaboration Features
- **Cursor Tracking**: See other users' cursor positions (when implemented in editors)
- **Selection Sharing**: Share text selections in collaborative documents
- **Typing Indicators**: See when other users are typing
- **Live Activity Feed**: Real-time feed of workspace activities

### 4. Real-time Notifications
- **System Notifications**: Instant notifications for important events
- **User-to-User Messaging**: Direct notification system between users
- **Achievement Alerts**: Real-time celebration of completed goals and habits
- **Workspace Updates**: Live updates about workspace changes

## Architecture

### Client-Side Components

#### `@/lib/realtime/pusher-client.ts`
- Pusher client configuration and connection management
- Real-time event subscription and broadcasting
- Presence channel management

#### `@/features/collaboration/hooks/useRealtime.ts`
- React hook for real-time functionality
- State management for collaborators and notifications
- Event handlers for different real-time events

#### `@/components/collaboration/CollaborationProvider.tsx`
- React context provider for collaboration features
- Global state management for real-time data
- Integration with authentication system

#### `@/components/realtime/PresenceIndicator.tsx`
- Visual component showing online users
- Avatar display with status indicators
- Connection status visualization

#### `@/components/realtime/ActivityFeed.tsx`
- Real-time activity stream component
- Displays recent workspace activities
- Filters and categorizes different event types

### Server-Side Components

#### `@/lib/realtime/pusher-server.ts`
- Server-side Pusher configuration
- Broadcasting utilities for different channels
- Connection management

#### `@/lib/realtime/broadcaster.ts`
- Centralized broadcasting service
- Type-safe event broadcasting
- Error handling and logging

#### API Routes
- `@/app/api/pusher/auth/route.ts`: Authentication for Pusher channels
- `@/app/api/pusher/trigger/route.ts`: Server-side event triggering

## Event Types

### Task Events
```typescript
{
  type: 'task-updated',
  data: {
    taskId: string,
    action: 'created' | 'updated' | 'deleted' | 'status_changed',
    task: TaskObject,
    changes?: Record<string, any>
  },
  userId: string,
  timestamp: number
}
```

### Goal Events
```typescript
{
  type: 'goal-updated',
  data: {
    goalId: string,
    action: 'created' | 'updated' | 'deleted' | 'progress' | 'completed',
    goal: GoalObject,
    progress?: number
  },
  userId: string,
  timestamp: number
}
```

### Habit Events
```typescript
{
  type: 'habit-updated',
  data: {
    habitId: string,
    action: 'created' | 'updated' | 'deleted' | 'completed' | 'streak_updated',
    habit: HabitObject,
    streak?: number
  },
  userId: string,
  timestamp: number
}
```

### Presence Events
```typescript
{
  type: 'cursor-moved' | 'selection-changed' | 'user-typing',
  data: {
    cursor?: { x: number, y: number },
    selection?: { start: number, end: number },
    isTyping?: boolean,
    documentId?: string
  },
  userId: string,
  timestamp: number
}
```

## Channel Structure

### Private Channels
- `private-user-{userId}`: Personal notifications and direct messages
- `private-task-{taskId}`: Task-specific updates and comments

### Presence Channels
- `presence-workspace-{workspaceId}`: Workspace presence and collaboration
- `presence-document-{documentId}`: Document-specific collaboration

## Environment Configuration

Required environment variables:
```bash
# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

## Usage Examples

### Basic Real-time Hook Usage
```typescript
import { useCollaboration } from '@/components/collaboration/CollaborationProvider';

function MyComponent() {
  const { 
    isConnected, 
    collaborators, 
    sendNotification,
    broadcast 
  } = useCollaboration();

  const handleTaskComplete = async (taskId: string) => {
    // Update task locally
    await updateTask(taskId, { completed: true });
    
    // Broadcast to other users
    await broadcast('task-updated', {
      taskId,
      action: 'status_changed',
      task: updatedTask
    });
  };

  return (
    <div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>Online: {collaborators.length} users</div>
    </div>
  );
}
```

### Server-side Broadcasting
```typescript
import { broadcastTaskUpdate } from '@/lib/realtime/broadcaster';

// In your API route
export async function POST(req: Request) {
  const task = await createTask(data);
  
  // Broadcast the update
  await broadcastTaskUpdate(
    {
      workspaceId: task.workspaceId,
      userId: user.id,
    },
    {
      taskId: task.id,
      action: 'created',
      task,
    }
  );
  
  return Response.json({ task });
}
```

### Presence Indicator Integration
```typescript
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator';

function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <PresenceIndicator className="ml-4" />
      </nav>
    </header>
  );
}
```

### Activity Feed Integration
```typescript
import { ActivityFeed } from '@/components/realtime/ActivityFeed';

function Dashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Other dashboard items */}
      <ActivityFeed 
        workspaceId="workspace-id"
        limit={10}
        compact={true}
      />
    </div>
  );
}
```

## Security Features

### Authentication
- All channels require authentication
- User identity verification for all events
- Workspace membership validation

### Authorization
- Channel-level access control
- User permission verification
- Rate limiting for event broadcasting

### Data Privacy
- No sensitive data in event payloads
- User information filtering
- Secure channel naming conventions

## Performance Considerations

### Connection Management
- Automatic reconnection on network issues
- Graceful degradation when offline
- Efficient event batching

### Event Optimization
- Debounced typing indicators
- Event deduplication
- Selective event subscription

### Memory Management
- Activity feed size limits
- Presence data cleanup
- Event handler cleanup on unmount

## Monitoring and Debugging

### Logging
- Comprehensive event logging
- Connection status tracking
- Error reporting with context

### Development Tools
- Real-time event inspector (in development)
- Connection status debugging
- Event replay capabilities

## Integration Points

### Existing API Routes
Real-time broadcasting has been integrated into:
- Task creation/updates (`/api/tasks/quick`)
- Goal progress updates
- Habit completion tracking
- Calendar event changes

### UI Components
Real-time features are integrated into:
- Dashboard activity feed
- Header presence indicator
- Task lists and boards
- Goal progress displays

## Testing

### Unit Tests
- Event broadcasting functions
- State management hooks
- Component rendering

### Integration Tests
- End-to-end real-time flows
- Multi-user scenarios
- Connection failure recovery

### Load Testing
- High-frequency event handling
- Multiple concurrent users
- Network resilience

## Future Enhancements

### Planned Features
1. **Document Collaboration**: Real-time text editing with conflict resolution
2. **Voice/Video Chat**: Integrated communication features
3. **Screen Sharing**: Collaborative review sessions
4. **Advanced Presence**: Away status, custom status messages
5. **Event History**: Replay and audit trails
6. **Mobile Push Notifications**: Native mobile notifications

### Performance Improvements
1. **Event Compression**: Reduce bandwidth usage
2. **Smart Caching**: Intelligent event caching strategies
3. **Connection Pooling**: Optimize connection resources
4. **Regional Clusters**: Geographic optimization

## Troubleshooting

### Common Issues
1. **Connection Failures**: Check environment variables and network
2. **Authentication Errors**: Verify user tokens and permissions
3. **Event Not Received**: Check channel subscriptions and filters
4. **Memory Leaks**: Ensure proper cleanup in useEffect hooks

### Debug Commands
```bash
# Test Pusher connection
curl -X POST http://localhost:3000/api/pusher/trigger \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"test","event":"test","data":{}}'

# Check presence channels
curl http://localhost:3000/api/pusher/auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For issues related to real-time features:
1. Check the browser console for connection errors
2. Verify environment variables are set correctly
3. Test with multiple browser sessions
4. Review the activity logs in the admin panel

The real-time system is designed to be resilient and will gracefully degrade when connections are unavailable, ensuring the application remains functional even without real-time features.