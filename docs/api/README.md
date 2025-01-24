# API Documentation

## Overview
GAIAthon25-Hub provides a comprehensive REST API for managing teams, projects, timelines, and notifications. This documentation outlines the API architecture, authentication, endpoints, and best practices.

## Base URL
```
Production: https://api.gaiathon25-hub.com
Development: http://localhost:3000/api
```

## API Versioning
The API version is included in the URL path:
```
/api/v1/[resource]
```

## Authentication
All API requests require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

### Rate Limiting
- 100 requests per 15-minute window per IP
- Rate limit headers included in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1635789600
  ```

## Common Headers

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <token>
Accept-Language: en-US
```

### Response Headers
```
Content-Type: application/json
X-Request-ID: <unique-request-id>
X-RateLimit-*: <rate-limit-info>
Cache-Control: <cache-directives>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Error Codes
| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Authentication required |
| AUTH_INVALID | Invalid authentication credentials |
| AUTH_EXPIRED | Authentication token expired |
| FORBIDDEN | Permission denied |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Invalid request data |
| RATE_LIMIT | Rate limit exceeded |
| SERVER_ERROR | Internal server error |

## Common Query Parameters

### Pagination
```
?page=1&limit=10
```

### Sorting
```
?sort=createdAt:desc
```

### Filtering
```
?filter[status]=active&filter[type]=team
```

### Search
```
?search=keyword
```

### Field Selection
```
?fields=id,name,email
```

## API Resources

### Authentication
- [Authentication API](./auth.md)
  - Login
  - Logout
  - Refresh Token
  - Password Reset
  - MFA Management

### Teams
- [Teams API](./teams.md)
  - Team Management
  - Member Management
  - Team Settings
  - Team Analytics

### Projects
- [Projects API](./projects.md)
  - Project CRUD
  - Project Members
  - Project Settings
  - Project Analytics

### Timeline
- [Timeline API](./timeline.md)
  - Event Management
  - Timeline Views
  - Event Categories
  - Timeline Export

### Notifications
- [Notifications API](./notifications.md)
  - Notification Management
  - Preferences
  - Push Subscriptions
  - Notification Analytics

### Analytics
- [Analytics API](./analytics.md)
  - Team Analytics
  - User Analytics
  - Project Analytics
  - System Analytics

## Webhooks
- [Webhook Documentation](./webhooks.md)
  - Event Types
  - Payload Format
  - Security
  - Best Practices

## API Clients
- [JavaScript/TypeScript SDK](./clients/javascript.md)
- [Python SDK](./clients/python.md)
- [Postman Collection](./clients/postman.md)

## Best Practices

### Security
- Always use HTTPS
- Implement rate limiting
- Validate all input
- Use appropriate authentication
- Follow least privilege principle

### Performance
- Use pagination
- Implement caching
- Minimize payload size
- Optimize queries
- Use compression

### Error Handling
- Use appropriate status codes
- Provide clear error messages
- Include request IDs
- Log errors properly
- Handle edge cases

## Testing
- [API Testing Guide](./testing.md)
  - Unit Tests
  - Integration Tests
  - Load Tests
  - Security Tests

## Monitoring
- [API Monitoring](./monitoring.md)
  - Performance Metrics
  - Error Tracking
  - Usage Analytics
  - Alerting

## Support
For API support and questions:
- Email: api-support@gaiathon25-hub.com
- Documentation: https://docs.gaiathon25-hub.com
- Status Page: https://status.gaiathon25-hub.com 