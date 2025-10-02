# Notification Service

The Notification Service is a microservice component of the Agrimaan platform that provides notification management, delivery, and preference handling functionality.

## Features

- **Multi-channel Notifications**: Send notifications through various channels (in-app, email, SMS, push, webhook)
- **Notification Templates**: Create and manage reusable notification templates with variable support
- **User Preferences**: Allow users to configure their notification preferences
- **Delivery Management**: Schedule notifications, track delivery status, and handle retries
- **Channel Configuration**: Configure and manage notification delivery channels

## API Endpoints

### Notifications

- `POST /api/notifications` - Create and send a notification
- `POST /api/notifications/batch` - Send a batch of notifications
- `GET /api/notifications/:id` - Get notification by ID
- `GET /api/notifications/user/:userId` - Get notifications for a specific user
- `GET /api/notifications/my/notifications` - Get notifications for the authenticated user
- `PUT /api/notifications/:id/read` - Mark a notification as read
- `PUT /api/notifications/user/:userId/read-all` - Mark all notifications as read for a specific user
- `PUT /api/notifications/my/read-all` - Mark all notifications as read for the authenticated user
- `GET /api/notifications/user/:userId/unread-count` - Count unread notifications for a specific user
- `GET /api/notifications/my/unread-count` - Count unread notifications for the authenticated user
- `PUT /api/notifications/:id/archive` - Archive a notification
- `DELETE /api/notifications/:id` - Delete a notification
- `POST /api/notifications/process-scheduled` - Process scheduled notifications (admin only)
- `POST /api/notifications/process-expired` - Process expired notifications (admin only)

### Templates

- `POST /api/templates` - Create a new notification template
- `GET /api/templates/:id` - Get template by ID
- `GET /api/templates/name/:name` - Get template by name and version
- `GET /api/templates` - Get templates with filters and pagination
- `PUT /api/templates/:id` - Update an existing template
- `POST /api/templates/:id/versions` - Create a new version of an existing template
- `DELETE /api/templates/:id` - Delete a template
- `POST /api/templates/name/:name/render` - Render a template with variables
- `PUT /api/templates/:id/toggle-status` - Toggle template active status
- `GET /api/templates/:id/variables` - Get template variables
- `POST /api/templates/:id/preview` - Preview template rendering

### Preferences

- `GET /api/preferences/user/:userId` - Get user notification preferences
- `GET /api/preferences/my` - Get notification preferences for the authenticated user
- `PUT /api/preferences/user/:userId` - Update user notification preferences
- `PUT /api/preferences/my` - Update notification preferences for the authenticated user
- `POST /api/preferences/user/:userId/push-token` - Add push token to user preferences
- `POST /api/preferences/my/push-token` - Add push token to authenticated user's preferences
- `DELETE /api/preferences/user/:userId/push-token` - Remove push token from user preferences
- `DELETE /api/preferences/my/push-token` - Remove push token from authenticated user's preferences
- `POST /api/preferences/user/:userId/webhook-endpoint` - Add webhook endpoint to user preferences
- `POST /api/preferences/my/webhook-endpoint` - Add webhook endpoint to authenticated user's preferences
- `DELETE /api/preferences/user/:userId/webhook-endpoint` - Remove webhook endpoint from user preferences
- `DELETE /api/preferences/my/webhook-endpoint` - Remove webhook endpoint from authenticated user's preferences
- `POST /api/preferences/user/:userId/check-delivery` - Check if a notification would be delivered based on user preferences
- `POST /api/preferences/my/check-delivery` - Check if a notification would be delivered based on authenticated user's preferences
- `POST /api/preferences/user/:userId/reset` - Reset user notification preferences to defaults
- `POST /api/preferences/my/reset` - Reset authenticated user's notification preferences to defaults

### Channels

- `POST /api/channels` - Create a new notification channel
- `GET /api/channels/:id` - Get channel by ID
- `GET /api/channels` - Get channels with filters and pagination
- `PUT /api/channels/:id` - Update an existing channel
- `DELETE /api/channels/:id` - Delete a channel
- `POST /api/channels/:id/test` - Test a channel configuration
- `PUT /api/channels/:id/default` - Set a channel as default for its type
- `GET /api/channels/:id/stats` - Get channel delivery statistics
- `GET /api/channels/type/:type` - Get channels by type

## Environment Variables

The service uses the following environment variables:

- `PORT` - Port number (default: 3010)
- `NODE_ENV` - Environment (development, production, test)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT authentication
- `JWT_EXPIRY` - JWT token expiration time
- `SERVICE_API_KEYS` - API keys for service-to-service communication
- `EMAIL_FROM` - Default sender email address
- `EMAIL_REPLY_TO` - Default reply-to email address
- `SMS_FROM` - Default SMS sender ID
- `VAPID_PUBLIC_KEY` - VAPID public key for web push notifications
- `VAPID_PRIVATE_KEY` - VAPID private key for web push notifications
- `VAPID_SUBJECT` - VAPID subject for web push notifications
- `REDIS_URL` - Redis connection string for caching
- `PROCESS_SCHEDULED_NOTIFICATIONS_INTERVAL` - Interval for processing scheduled notifications
- `PROCESS_EXPIRED_NOTIFICATIONS_INTERVAL` - Interval for processing expired notifications

## Installation and Setup

### Prerequisites

- Node.js 16+
- MongoDB
- Redis (optional, for caching)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on the `.env.example` template
4. Start the development server:
   ```
   npm run dev
   ```

### Docker Deployment

Build and run the Docker container:

```
docker build -t notification-service .
docker run -p 3010:3010 --env-file .env notification-service
```

## Testing

Run tests:

```
npm test
```

Run tests with coverage:

```
npm run test:coverage
```

## Integration with Other Services

The Notification Service integrates with the following Agrimaan services:

- User Service - For user authentication and authorization
- Analytics Service - For notification analytics and reporting
- All other services - As notification sources