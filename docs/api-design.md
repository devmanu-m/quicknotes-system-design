# QuickNotes API Design

This is the API the backend team should build for the real QuickNotes service. All requests and responses use JSON. Every endpoint except registration and login needs a header `Authorization: Bearer <token>`.

Base path: `/api/v1`

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| GET | `/notes` | List the logged-in user's notes (supports `?page=`, `?limit=` and `?tag=`) | 200 OK |
| GET | `/notes/{id}` | Get one note | 200 OK |
| POST | `/notes` | Create a note | 201 Created |
| PUT | `/notes/{id}` | Replace the title, body and tags of a note | 200 OK |
| DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| GET | `/tags` | List all tags used by the user | 200 OK |
| POST | `/users` | Register a new user | 201 Created |

## Create a note

Request: `POST /api/v1/notes`

    {
      "title": "Buy milk",
      "body": "Two litres, full cream",
      "tags": ["personal"]
    }

Response: `201 Created`

    {
      "id": 101,
      "title": "Buy milk",
      "body": "Two litres, full cream",
      "tags": ["personal"],
      "userId": 1,
      "createdAt": "2026-10-10T09:30:00Z"
    }

## List notes

Request: `GET /api/v1/notes?page=1&limit=2`

Response: `200 OK`

    {
      "page": 1,
      "limit": 2,
      "total": 42,
      "notes": [
        {
          "id": 101,
          "title": "Buy milk",
          "body": "Two litres, full cream",
          "tags": ["personal"],
          "createdAt": "2026-10-10T09:30:00Z"
        },
        {
          "id": 100,
          "title": "Finish Project 2",
          "body": "",
          "tags": ["study"],
          "createdAt": "2026-10-09T18:05:00Z"
        }
      ]
    }

## Error codes

| Status | Meaning | Example of when it happens |
|---|---|---|
| 400 Bad Request | The request is invalid | `POST /notes` with no `title`, or a title longer than 100 characters |
| 401 Unauthorized | The user is not logged in | Any request with a missing or expired token |
| 403 Forbidden | Logged in, but not allowed | A user tries `DELETE /notes/7` on a note owned by someone else |
| 404 Not Found | The resource does not exist | `GET /notes/9999` when no note has that id |
| 500 Internal Server Error | A bug or failure on the server | The database is unreachable while saving a note |

Example error body (400):

    {
      "error": {
        "code": 400,
        "message": "title is required",
        "field": "title"
      }
    }