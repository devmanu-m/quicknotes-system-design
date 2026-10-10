# QuickNotes System Design

QuickNotes is moving from a browser-only app to an online service for 1 million users. This project has two parts: an API client that talks to the JSONPlaceholder practice API using GET, POST and DELETE, and a set of design documents the backend team can build from.

## How to run the API client

1. Clone the repository: `git clone https://github.com/devmanu-m/quicknotes-system-design.git`
2. Open the `quicknotes-system-design` folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**, or open `index.html` directly in your browser.
4. Click **Load notes** to fetch 10 notes, use the form to create a note, and use **Delete** to remove one.

JSONPlaceholder does not really save changes, so created notes disappear on reload and deleted notes come back.

## Documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- How to use `fetch` with `async` and `await`, check `response.ok`, and handle errors with `try`, `catch` and `finally`.
- How to show loading, success, error and empty states and disable buttons while a request runs, so the page always matches what is happening.
- How to design a REST API with the right methods, paths and status codes (201, 204, 400, 401, 403, 404, 500).
- How a join table turns a many-to-many relationship into two one-to-many links, and why an index on `notes(user_id, created_at)` speeds up the most common query.
- How a read-heavy system uses a cache, a read replica and a queue, and why each one comes with a trade-off.