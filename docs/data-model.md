# QuickNotes Data Model

The database has four tables: users, notes, tags and note_tags.

## Entities

### users

| Column | Type | Key / rule |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL, default current time |

### notes

| Column | Type | Key / rule |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users(id), NOT NULL |
| title | TEXT | NOT NULL, at most 100 characters |
| body | TEXT | Optional |
| created_at | TEXT | NOT NULL, default current time |

### tags

| Column | Type | Key / rule |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | NOT NULL, UNIQUE |

### note_tags

| Column | Type | Key / rule |
|---|---|---|
| note_id | INTEGER | Foreign key to notes(id), part of the primary key |
| tag_id | INTEGER | Foreign key to tags(id), part of the primary key |

## Relationships

- **users to notes is one-to-many.** One user owns many notes, and each note belongs to exactly one user (`notes.user_id`).
- **notes to tags is many-to-many.** One note can have many tags, and one tag can be used on many notes.
- **note_tags is the join table** that turns the many-to-many link into two one-to-many links. Each row pairs one note with one tag, and the composite primary key stops the same tag being added to a note twice.

## CREATE TABLE statements

    CREATE TABLE users (
      id            INTEGER PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE notes (
      id         INTEGER PRIMARY KEY,
      user_id    INTEGER NOT NULL,
      title      TEXT NOT NULL CHECK (length(title) <= 100),
      body       TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE tags (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE note_tags (
      note_id INTEGER NOT NULL,
      tag_id  INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id),
      FOREIGN KEY (tag_id)  REFERENCES tags(id)
    );

## Example queries

All notes for one user with their tags (JOIN):

    SELECT notes.id, notes.title, tags.name AS tag
    FROM notes
    LEFT JOIN note_tags ON note_tags.note_id = notes.id
    LEFT JOIN tags      ON tags.id = note_tags.tag_id
    WHERE notes.user_id = 1
    ORDER BY notes.created_at DESC;

All notes that have the tag "work":

    SELECT notes.title
    FROM tags
    JOIN note_tags ON note_tags.tag_id = tags.id
    JOIN notes     ON notes.id = note_tags.note_id
    WHERE tags.name = 'work';

Number of notes per user:

    SELECT users.name, COUNT(notes.id) AS note_count
    FROM users
    LEFT JOIN notes ON notes.user_id = users.id
    GROUP BY users.id, users.name;

## Indexes

    CREATE INDEX idx_notes_user_created ON notes (user_id, created_at);
    CREATE INDEX idx_note_tags_tag ON note_tags (tag_id);

- **`notes (user_id, created_at)`:** the most common request is "show this user's newest notes". Without this index the database would scan every note of every user. With it, the database jumps straight to one user's notes, already sorted by date.
- **`note_tags (tag_id)`:** the primary key on (note_id, tag_id) is already fast when searching by note, but it does not help when searching by tag alone, as in "all notes with the tag work".

## SQL or NoSQL?

I choose SQL. QuickNotes data is structured and connected: users own notes, and notes link to tags. SQL enforces those links with foreign keys, prevents bad data with NOT NULL, UNIQUE and CHECK rules, and answers questions such as "notes per user" or "notes with a tag" with JOIN and GROUP BY. Transactions keep data consistent, for example when a note and its tags are saved together. The expected load (about 7 writes per second on average) is well within what a single SQL primary with read replicas can handle, so we do not need NoSQL's flexible schema or extreme scale.