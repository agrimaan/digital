# Admin Service

This microservice provides administrative functionality for the Agrimaan platform, including system settings management, admin user management, dashboards, reports, audit logging, and notifications.

## Features

- Admin user management with role-based access control
- System settings configuration
- Dashboard creation and management
- Report generation and scheduling
- Audit logging for all administrative actions
- Admin notifications system
- Analytics and statistics for platform monitoring

## API Endpoints

### Admin Management
- `POST /api/admins/register` - Register a new admin
- `POST /api/admins/login` - Admin login
- `GET /api/admins/me` - Get current admin profile
- `GET /api/admins` - Get all admins
- `GET /api/admins/:id` - Get admin by ID
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin
- `PUT /api/admins/:id/permissions` - Update admin permissions
- `PUT /api/admins/:id/status` - Activate or deactivate admin
- `POST /api/admins/change-password` - Change admin password
- `POST /api/admins/forgot-password` - Forgot password
- `POST /api/admins/reset-password` - Reset password

### System Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings
- `PUT /api/settings/email` - Update email settings
- `PUT /api/settings/sms` - Update SMS settings
- `PUT /api/settings/payment` - Update payment settings
- `PUT /api/settings/security` - Update security settings
- `PUT /api/settings/maintenance` - Update maintenance mode
- `PUT /api/settings/api` - Update API settings
- `POST /api/settings/test-email` - Test email configuration
- `POST /api/settings/test-sms` - Test SMS configuration

### Dashboards
- `GET /api/dashboards/default` - Get default dashboard
- `GET /api/dashboards/:id` - Get dashboard by ID
- `GET /api/dashboards` - Get all dashboards
- `POST /api/dashboards` - Create a new dashboard
- `PUT /api/dashboards/:id` - Update a dashboard
- `DELETE /api/dashboards/:id` - Delete a dashboard
- `PUT /api/dashboards/:id/default` - Set a dashboard as default
- `GET /api/dashboards/:id/data` - Get dashboard data

### Reports
- `POST /api/reports` - Create a new report
- `GET /api/reports/:id` - Get a report by ID
- `GET /api/reports` - Get all reports
- `PUT /api/reports/:id` - Update a report
- `DELETE /api/reports/:id` - Delete a report
- `POST /api/reports/:id/generate` - Generate a report
- `GET /api/reports/templates` - Get report templates
- `POST /api/reports/templates/:id` - Create report from template

### Audit Logs
- `POST /api/audit-logs` - Create a new audit log entry
- `GET /api/audit-logs/admin/:adminId` - Get audit logs by admin
- `GET /api/audit-logs/resource/:resourceType/:resourceId?` - Get audit logs by resource
- `GET /api/audit-logs/action/:action` - Get audit logs by action
- `GET /api/audit-logs/date-range` - Get audit logs by date range
- `GET /api/audit-logs` - Get all audit logs with filtering
- `GET /api/audit-logs/statistics` - Get audit log statistics
- `DELETE /api/audit-logs/old/:days` - Delete old audit logs

### Notifications
- `POST /api/notifications` - Create a new notification
- `GET /api/notifications/:id` - Get a notification by ID
- `GET /api/notifications` - Get notifications for an admin
- `PUT /api/notifications/:id/read` - Mark a notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notifications count
- `DELETE /api/notifications/:id` - Delete a notification
- `DELETE /api/notifications` - Delete all notifications
- `POST /api/notifications/all-admins` - Send notification to all admins
- `POST /api/notifications/role/:role` - Send notification to admins by role
- `POST /api/notifications/system-alert` - Create system alert notification

### Analytics
- `GET /api/analytics/overview` - Get system overview statistics
- `GET /api/analytics/users` - Get user statistics
- `GET /api/analytics/marketplace` - Get marketplace statistics
- `GET /api/analytics/crops` - Get crop statistics
- `GET /api/analytics/iot` - Get IoT device statistics
- `GET /api/analytics/weather` - Get weather statistics
- `GET /api/analytics/logistics` - Get logistics statistics
- `GET /api/analytics/revenue` - Get revenue statistics
- `GET /api/analytics/orders` - Get order statistics
- `GET /api/analytics/fields` - Get field statistics
- `GET /api/analytics/health` - Get system health statistics

## Environment Variables

- `PORT` - Server port (default: 3012)
- `MONGODB_URI` - MongoDB connection string
- `USER_SERVICE_URL` - URL of the user service
- `JWT_SECRET` - Secret for JWT token generation
- `JWT_EXPIRE` - JWT token expiration time
- `EMAIL_HOST` - SMTP host for email sending
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password
- `EMAIL_FROM` - From email address
- `FIELD_SERVICE_URL` - URL of the field service
- `IOT_SERVICE_URL` - URL of the IoT service
- `CROP_SERVICE_URL` - URL of the crop service
- `MARKETPLACE_SERVICE_URL` - URL of the marketplace service
- `LOGISTICS_SERVICE_URL` - URL of the logistics service
- `WEATHER_SERVICE_URL` - URL of the weather service
- `ANALYTICS_SERVICE_URL` - URL of the analytics service
- `NOTIFICATION_SERVICE_URL` - URL of the notification service
- `BLOCKCHAIN_SERVICE_URL` - URL of the blockchain service
- `NODE_ENV` - Environment (development, production)

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the required environment variables.

3. Start the service:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

## Docker

Build the Docker image:
```
docker build -t agrimaan/admin-service .
```

Run the container:
```
docker run -p 3012:3012 -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 agrimaan/admin-service
```

## Testing

Run tests:
```
npm test
```