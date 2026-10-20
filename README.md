# Usage Metering & Quota Service

A REST API built with TypeScript, Express, PostgreSQL, and Drizzle ORM to manage usage quotas for accounts and users.

## Tech Stack

- TypeScript and Express
- PostgreSQL and Drizzle ORM
- Docker and Docker Compose
- k6 for performance testing

## Assumptions

- **Account:** Represents an application using the service. Each account has its own API key.
- **externalUserId:** An identifier provided by the client to identify an end user. It is unique within the account, not necessarily across all accounts. The service uses it to associate usage with the correct user.
- **Idempotency-Key:** A unique key sent with each consumption request. Retrying the same request with the same key must not deduct quota twice. The key is scoped to the account.
- **Plans:** Predefined plans are shared. Custom plans belong to the account that created them.
- **Quota:** Plans define a monthly allowance and a maximum number of units per request.
- **Scope:** A plan can apply to an account or an individual user.
- **Authentication:** The account is identified from its API key, not from the request body.

## API Endpoints

All protected endpoints require:

```http
Authorization: Bearer YOUR_API_KEY
```

### 1. Create a Plan

`POST /api/plans`

Creates a custom plan for the authenticated account.

**Headers**

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Body**

```json
{
  "name": "Premium",
  "description": "Premium usage plan",
  "scope": "user",
  "monthlyAllowance": 50000,
  "maxPerRequest": 5000
}
```

The `accountId` and `isPredefined` fields are assigned by the service, not provided by the client.

### 2. Get Account Plans

`GET /api/plans`

Returns custom plans belonging to the authenticated account.

**Headers**

```http
Authorization: Bearer YOUR_API_KEY
```

**Body:** None.

### 3. Get a Specific Plan

`GET /api/plans/:id`

Returns a plan by its ID, provided it belongs to the authenticated account.

**Headers**

```http
Authorization: Bearer YOUR_API_KEY
```

**Path parameter:** `id` — the plan's UUID.

**Body:** None.

### 4. Consume Usage

`POST /api/usage/consume`

Checks the applicable quotas and records whether the request is accepted or rejected.

**Headers**

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Idempotency-Key: unique-request-key
```

**Body**

```json
{
  "externalUserId": "user-123",
  "units": 100
}
```

- `externalUserId`: Identifies the end user within the authenticated account.
- `units`: Number of units requested for consumption.
- `Idempotency-Key`: Prevents duplicate consumption when a request is retried.

The service checks the request limit and applicable monthly quotas. Accepted requests deduct quota; rejected requests are logged without deducting quota.

### 5. Get Usage Records

`GET /api/usage`

Returns usage records for the authenticated account.

**Headers**

```http
Authorization: Bearer YOUR_API_KEY
```

**Body:** None.

Any query parameters for filtering or pagination depend on the implemented endpoint.

## Local Setup

Requirements: Docker Desktop and Git.

```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
docker compose up -d --build
```

The API runs at `http://localhost:8080`.

PostgreSQL is available on port `5433` from the host machine.

To stop the application:

```bash
docker compose down
```

## Testing

Automated tests should cover API key validation, account isolation, quota enforcement, and idempotency.

Performance tests use k6. Include the test scripts, commands, dependencies, and measured results in the repository.

## Known Limitations

Document any unfinished functionality and limitations discovered during testing.
