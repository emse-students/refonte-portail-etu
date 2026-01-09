# API Documentation

This document outlines the available API endpoints for the Student Portal.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

Most endpoints require authentication. The system uses session-based authentication.

## Endpoints

### Users

#### `GET /api/users`

Retrieves a list of all users.

- **Permissions**: `ADMIN` or `SITE_ADMIN`
- **Response**: Array of User objects.
  ```json
  [
  	{
  		"id": 1,
  		"first_name": "John",
  		"last_name": "Doe",
  		"email": "john@example.com",
  		"login": "jdoe",
  		"promo": 2024,
  		"permissions": 0,
  		"max_role_permissions": 0
  	}
  ]
  ```

#### `POST /api/users`

Creates a new user.

- **Permissions**: `ADMIN` or `SITE_ADMIN`
- **Body**:
  ```json
  {
  	"first_name": "Jane",
  	"last_name": "Doe",
  	"email": "jane@example.com",
  	"login": "jane.doe",
  	"promo": 2025
  }
  ```

#### `DELETE /api/users`

Deletes a user.

- **Permissions**: `ADMIN` or `SITE_ADMIN`
- **Body**:
  ```json
  { "id": 1 }
  ```

#### `GET /api/users/[id]/roles`

Retrieves detailed role information for a specific user.

- **Permissions**: `ADMIN` or `SITE_ADMIN`
- **Response**:
  ```json
  [
  	{
  		"role_name": "President",
  		"permissions": 15,
  		"association_name": "BDE",
  		"list_name": null
  	}
  ]
  ```

### Associations

#### `GET /api/associations`

Retrieves a list of all associations.

- **Permissions**: Public (or Authenticated)
- **Response**:
  ```json
  [
  	{
  		"id": 1,
  		"handle": "bde",
  		"name": "Bureau des Élèves",
  		"description": "...",
  		"color": 16777215
  	}
  ]
  ```

### Configuration (System)

#### `GET /api/config`

Retrieves system configuration key-value pairs.

- **Permissions**: Authenticated
- **Response**:
  ```json
  {
  	"maintenance_mode": "false",
  	"global_announcement": "Welcome!",
  	"event_submission_open": "true"
  }
  ```

#### `POST /api/config`

Updates a configuration value.

- **Permissions**: `ADMIN`, `SITE_ADMIN`, or `EVENTS` (for event-related keys)
- **Body**:
  ```json
  {
  	"key": "maintenance_mode",
  	"value": "true"
  }
  ```

### Events

#### `GET /api/events`

Retrieves a list of events.

- **Permissions**: Public
- **Response**: Array of Event objects.

#### `POST /api/events`

Creates a new event.

- **Permissions**: `EVENTS` or Association Admin
- **Body**: Event details (name, date, description, etc.)

### Lists

#### `GET /api/lists`

Retrieves lists (e.g., BDE lists).

#### `POST /api/lists`

Creates a new list.

### Members

#### `GET /api/members`

Retrieves members of associations or lists.

#### `POST /api/members`

Adds a member to an association or list.

### Roles

#### `GET /api/roles`

Retrieves available roles.

#### `POST /api/roles`

Creates or updates a role.

### Calendar

#### `GET /api/calendar`

Retrieves calendar events formatted for display.

### Images

#### `POST /api/image`

Uploads an image to the gallery service.

- **Headers**: `x-api-key` (internal use)
- **Body**: FormData with `file` field.

#### `GET /api/image/[id]`

Proxies an image from the gallery service.

### Auth

#### `GET /api/auth/login`

Initiates the CAS login flow.

#### `GET /api/auth/logout`

Logs the user out.
