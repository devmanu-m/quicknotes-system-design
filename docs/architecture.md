# QuickNotes Architecture

## Requirements

### Functional

- Users can register and log in.
- Users can create, read, update and delete their own notes.
- Users can tag notes and list notes by tag.
- Users can only see and change their own notes.

### Non-functional

- **Scale:** support 1 million users.
- **Availability:** 99.9% uptime, with no single point of failure.
- **Speed:** most reads finish in under 200 ms.
- **Durability:** saved notes are never lost, with daily backups.
- **Security:** HTTPS everywhere, hashed passwords, and each user can access only their own data.

## Load estimate for 1 million users

Assumptions:

- 1,000,000 registered users, 30% active each day, so 300,000 daily active users.
- Each active user reads notes 20 times a day and creates 2 notes a day.
- A note takes about 1 KB (title, body and metadata).
- One day has 86,400 seconds. Peak traffic is 5 times the average.

| Measure | Working | Result |
|---|---|---|
| Reads per day | 300,000 x 20 | 6,000,000 |
| Reads per second (average) | 6,000,000 / 86,400 | about 69 |
| Reads per second (peak) | 69 x 5 | about 350 |
| Writes per day | 300,000 x 2 | 600,000 |
| Writes per second (average) | 600,000 / 86,400 | about 7 |
| Writes per second (peak) | 7 x 5 | about 35 |
| Storage per year | 600,000 x 1 KB x 365 | about 219 GB |

The system is **read-heavy** (about 10 reads for every write), so the design focuses on caching and read replicas.

## Architecture diagram

    Client (browser / mobile app)
          |
          |  looks up the address
          v
    +-----------+                 +-----------+
    |    DNS    |                 |    CDN    |  static files
    +-----------+                 +-----------+
          |
          v
    +-----------------+
    |  Load balancer  |
    +-----------------+
         |         |
         v         v
    +----------+ +----------+
    |   App    | |   App    |
    | server 1 | | server 2 |
    +----------+ +----------+
         |            |
         +-----+------+
               |
      +--------+---------+------------------+
      |                  |                  |
      v                  v                  v
    +-------+      +-------------+      +---------+
    | Cache |      |   Primary   |      |  Queue  |
    |(Redis)|      |  database   |      +---------+
    +-------+      +-------------+           |
                          |                  v
                          | replication  +---------+
                          v              | Worker  |
                   +--------------+      +---------+
                   | Read replica |
                   +--------------+

## What each component does

- **Client:** the browser or phone app where users read and write notes.
- **DNS:** turns the name quicknotes.example into the address of the load balancer, so users do not need to know any IP addresses.
- **CDN:** serves static files (HTML, CSS, JavaScript) from servers close to the user, so pages load fast and our servers are not busy with files.
- **Load balancer:** spreads requests across the app servers and stops sending traffic to a server that has failed.
- **App servers (two or more):** run the API logic (login, validation, notes), and because they are stateless we can add more as traffic grows.
- **Cache:** keeps recently read note lists in memory, so repeated reads do not hit the database.
- **Primary database:** stores users, notes and tags, and is the single place where writes happen, which keeps data consistent.
- **Read replica:** a copy of the primary that answers read queries, which takes load off the primary.
- **Queue:** holds background jobs, so the API can reply to the user without waiting for slow work.
- **Worker:** takes jobs from the queue and does the slow work (such as updating the search index or sending a backup copy) away from the user's request.

## Request flows

### GET /notes

1. The client asks DNS for the address and sends the request to the load balancer.
2. The load balancer picks an app server.
3. The app server checks the token. If it is missing or invalid, it replies 401.
4. The app server looks in the cache for this user's notes (page 1).
5. If the cache has them (a hit), the app server returns them with 200 OK.
6. If not (a miss), the app server reads the notes from the read replica.
7. The app server stores the result in the cache for 60 seconds, then returns 200 OK.

### POST /notes

1. The client sends the request to the load balancer, which picks an app server.
2. The app server checks the token (401 if invalid).
3. The app server validates the body. A missing title or one over 100 characters gets 400.
4. The app server saves the note, and its tags, in the primary database in one transaction.
5. The app server deletes this user's cached note lists, so the next read shows the new note.
6. The app server adds a job to the queue (for example, "update the search index").
7. The app server replies 201 Created with the new note.
8. A worker takes the job from the queue and completes it in the background.

## Trade-offs

- **Caching: speed vs freshness.** The cache makes reads very fast, but a cached list can be a few seconds out of date, and clearing the cache correctly after every write is hard. We accept this because reads are about ten times more common than writes.
- **Read replica: scale vs consistency.** Replicas copy data from the primary with a small delay (replication lag). A user could create a note and not see it straight away. We reduce this by reading a user's own recent notes from the primary for a short time after they write.
- **Queue and worker: fast responses vs immediate results.** Users get a quick reply, but background work such as search indexing finishes a little later. It also adds more parts to run and monitor.

## Avoiding single points of failure

- **App servers:** at least two behind the load balancer, so if one fails the other keeps serving requests.
- **Load balancer:** run as a redundant pair, so one can take over if the other fails.
- **Database:** the read replica can be promoted to primary if the primary fails, and backups are taken every day.
- **Cache:** run as a small cluster. If it fails, requests fall back to the database (slower, but still working).
- **Queue:** use a replicated queue service, so jobs are not lost if one node fails.
- **DNS and CDN:** use providers with many servers around the world.