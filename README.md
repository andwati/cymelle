# Cymelle

Cymelle is a commerce, delivery, and ride operations application. Customers can browse products, place orders, request delivery rides, and pay through Paystack. Admins manage products, inventory, orders, users, and rides. Drivers accept and complete delivery rides.

## Architecture

The current system is a three-tier application: a React frontend, a Spring Boot API, and PostgreSQL. Paystack is the external payment provider.

```text
+-----------------------------+
| Browser                     |
| Customer / Admin / Driver   |
+-------------+---------------+
              |
              | HTTP
              | http://localhost:3000
              v
+-----------------------------+
| orders-frontend             |
| React + TypeScript          |
| TanStack Router + Query     |
| Vite dev server             |
+-------------+---------------+
              |
              | REST API
              | VITE_API_BASE_URL
              | http://localhost:8080/api
              v
+-----------------------------+
| orders-backend              |
| Spring Boot REST API        |
| Security + Services + JPA   |
| Swagger/OpenAPI             |
+--------+--------------------+
         |              |
         | JDBC         | HTTPS
         v              v
+----------------+   +------------------+
| PostgreSQL     |   | Paystack API     |
| app data       |   | payments         |
+----------------+   +------------------+
```

Local Docker Compose runs the same shape with three services:

```text
+------------------------------------------------------------+
| Docker Compose project: cymelle                            |
|                                                            |
|  web: node:24                         api: temurin 17      |
|  pnpm dev --host 0.0.0.0              ./gradlew bootRun    |
|  localhost:3000      ------------->   localhost:8080       |
|       |                                      |              |
|       v                                      v              |
|  orders-frontend/                       db: postgres:18    |
|  bind mount                             localhost:5432     |
|                                              |             |
|                                              v             |
|                                       postgres-data volume |
+------------------------------------------------------------+
```

## Project Layout

- `orders-frontend/`: React web app, route files, API clients, hooks, shared UI, dashboard and storefront screens.
- `orders-backend/`: Spring Boot API, controllers, services, repositories, DTOs, entities, security, OpenAPI, and seed data.
- `compose.yml`: Local development stack for Postgres, API, and web.
- `.env.example`: Local environment variables consumed by Docker Compose.
- `render.yaml`: Render Blueprint for Docker-backed deployment.
- `DEPLOYMENT.md`: Render and Neon deployment notes.
- `PART_2.md`: Real-time location tracking backend design walkthrough.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- TanStack Router for file-based routing
- TanStack Query for server state
- TanStack Table and TanStack Form
- Tailwind CSS 4
- Radix UI, local UI components, Lucide React, and Tabler Icons
- pnpm
- Biome for linting and formatting
- Vitest for tests
- Nitro output for production server builds

### Backend

- Java 17
- Spring Boot 3.5
- Spring Web
- Spring Security
- Spring Data JPA
- Bean Validation
- PostgreSQL driver
- H2 test dependency
- Springdoc OpenAPI / Swagger UI
- Gradle Kotlin DSL

### Infrastructure

- Docker Compose for local development
- PostgreSQL 18 Alpine locally
- Render Docker web services for deployment
- Neon PostgreSQL for deployed database
- Paystack payment integration

## Domain Model

```text
AppUser
  id, username, displayName, passwordHash, role, enabled
  role: ADMIN | CUSTOMER | DRIVER
      |
      +--> CUSTOMER owns Orders and requested Rides
      +--> DRIVER can accept and complete Rides
      +--> ADMIN manages products, users, orders, inventory, and rides

Product
  id, name, sku, price, currency, active
      |
      +-- one-to-one --> InventoryItem
      |
      +-- many-to-one from --> OrderItem

InventoryItem
  id, product, availableQuantity, reservedQuantity, reorderLevel
  status: IN_STOCK | LOW_STOCK | OUT_OF_STOCK

Order
  id, customerName, customer, status, totalAmount, currency, createdAt
  status: PENDING | SHIPPED | DELIVERED | CANCELLED
      |
      +-- one-to-many --> OrderItem
      |
      +-- optional delivery association --> Ride
      |
      +-- one-to-one --> Payment

OrderItem
  id, order, product, productName, quantity, unitPrice, lineTotal
  stores product name and price snapshot at checkout time

Ride
  id, customer, driver, order, pickupLocation, dropoffLocation
  distanceKm, fareAmount, currency, status
  status: REQUESTED | ACCEPTED | COMPLETED | CANCELLED

Payment
  id, order, ride, reference, productSubtotal, rideFare
  amountMajor, amountSubunits, currency, status
  status: PENDING | PAID | FAILED | ABANDONED | REFUNDED
```

## Main Application Flows

### Authentication

```text
User registers or logs in
        |
        v
Spring Security authenticates credentials
        |
        v
Frontend calls /api/auth/me
        |
        v
Routes and backend endpoints use the user's role
```

Roles drive most behavior:

- Customers can browse, order, pay, request rides, and view their own orders.
- Drivers can see requested rides, accept rides, and complete assigned rides.
- Admins can manage users, products, orders, inventory, and ride status.

### Product and Inventory

```text
Admin creates product
        |
        v
Product stored with SKU, price, currency, active flag
        |
        v
InventoryItem tracks available quantity and reorder level
        |
        v
Inventory status is derived from available quantity
```

Inventory status is computed:

- `OUT_OF_STOCK` when available quantity is `0`
- `LOW_STOCK` when available quantity is at or below the reorder level
- `IN_STOCK` otherwise

### Checkout Quote

```text
Customer submits cart + optional delivery ride
        |
        v
Backend validates products and stock
        |
        v
Backend calculates product subtotal
        |
        +--> optional fare calculation for delivery ride
        |
        v
Quote returns productSubtotal, rideFare, grandTotal, currency, expiresAt
```

The quote endpoint is useful before Paystack initialization so the customer can see the final total.

### Order Placement

```text
Customer places order
        |
        v
Backend loads active products
        |
        v
Backend locks inventory rows for update
        |
        +--> insufficient stock -> request fails
        |
        v
Inventory is deducted
        |
        v
Order and OrderItems are created as PENDING
        |
        +--> optional delivery ride is created as REQUESTED
```

Order items store `productName`, `unitPrice`, and `lineTotal`, so historical orders keep their checkout-time product snapshot even if the product changes later.

### Payment With Paystack

```text
Customer initializes Paystack checkout
        |
        v
Backend calculates quote and creates pending order
        |
        v
Payment row is created with unique reference
        |
        v
Backend initializes Paystack transaction
        |
        v
Frontend redirects user to Paystack authorization URL
        |
        v
Paystack callback/webhook triggers backend verification
        |
        v
Backend verifies reference, amount, and currency with Paystack
        |
        +--> success -> Payment becomes PAID
        +--> failure -> Payment becomes FAILED / ABANDONED / REFUNDED
```

The backend verifies payment server-to-server. The frontend callback is not treated as proof of payment by itself.

### Order Status

```text
PENDING -> SHIPPED -> DELIVERED
   |
   +-> CANCELLED
```

Rules in the domain model:

- Only pending orders can be cancelled by the normal cancellation flow.
- Cancelling restores inventory quantities.
- Final orders cannot be moved to another status.
- Completing an attached ride marks the order as delivered.

### Ride Status

```text
REQUESTED -> ACCEPTED -> COMPLETED
    |
    +-> CANCELLED
```

Ride behavior:

- Customers request rides for their own orders.
- Drivers see requested rides plus rides assigned to them.
- Drivers accept requested rides.
- Drivers complete rides assigned to them.
- Completing a ride also marks the attached order as delivered.
- Admins can cancel or complete rides.

## API Surface

All backend endpoints are under `/api`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/csrf` |
| Products | `GET /products`, `GET /products/{id}`, `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}` |
| Inventory | `GET /inventory`, `GET /inventory/low-stock` |
| Orders | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `DELETE /orders/{id}`, `PATCH /orders/{id}/status` |
| Checkout | `POST /checkout/quote` |
| Paystack | `POST /payments/paystack/initialize`, `POST /payments/paystack/verify/{reference}`, `POST /payments/paystack/webhook` |
| Rides | `GET /rides`, `POST /rides`, `POST /rides/{id}/accept`, `POST /rides/{id}/complete`, `DELETE /rides/{id}`, `PATCH /rides/{id}/status` |
| Users | `GET /users`, `GET /users/customers`, `GET /users/drivers`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}` |
| Fare | `GET /fare/calculate` |
| Health | `GET /health` |

Swagger UI is available locally at `http://localhost:8080/swagger-ui.html`.

## Seed Data

Local development seeds demo data when `SEED_DATA=true`.

Demo users:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Driver | `driver` | `driver123` |
| Driver | `driver2` | `driver123` |
| Driver | `driver3` | `driver123` |
| Customer | `customer` | `customer123` |
| Customer | `customer2` | `customer123` |
| Customer | `customer3` | `customer123` |
| Customer | `customer4` | `customer123` |

Seeded products include accessories and office equipment such as wireless mice, keyboards, cables, stands, webcams, headphones, monitors, docks, backpacks, power banks, drawing tablets, and chairs.

## Local Development

### Prerequisites

- Docker and Docker Compose
- Paystack test keys if you want to test checkout payments

### Run Everything With Docker Compose

```sh
cp .env.example .env
docker compose up
```

Services:

- Web: `http://localhost:3000`
- API base URL: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- Postgres: `localhost:5432`
- Default database/user/password: `cymelle` / `cymelle` / `cymelle`

Useful commands:

```sh
docker compose logs -f api
docker compose logs -f web
docker compose restart api
docker compose down
docker compose down -v
```

The web service mounts `orders-frontend/`, so frontend edits reload through Vite. Restart the `api` service after backend code changes. Use `docker compose down -v` only when you want to delete local Postgres data and dependency cache volumes.

### Environment Variables

Copy `.env.example` to `.env`, then adjust values as needed.

```sh
POSTGRES_DB=cymelle
POSTGRES_USER=cymelle
POSTGRES_PASSWORD=cymelle
POSTGRES_PORT=5432

API_PORT=8080
WEB_PORT=3000
VITE_API_BASE_URL=http://localhost:8080/api
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000
SEED_DATA=true

LOW_STOCK_THRESHOLD=10

FARE_BASE_FARE=100.00
FARE_PER_KM_RATE=50.00
FARE_MINIMUM_FARE=150.00
FARE_DEFAULT_SURGE_MULTIPLIER=1.0
FARE_CURRENCY=KES

PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_CALLBACK_URL=http://localhost:3000/payments/paystack/callback
PAYSTACK_WEBHOOK_SECRET=
PAYSTACK_API_BASE_URL=https://api.paystack.co
```

For Paystack checkout, set:

```sh
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_CALLBACK_URL=http://localhost:3000/payments/paystack/callback
```

If `PAYSTACK_WEBHOOK_SECRET` is empty, the backend uses the Paystack secret key for webhook signature verification.

### Run Services Manually

Docker Compose is recommended, but the services can run separately.

Backend:

```sh
cd orders-backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/cymelle \
SPRING_DATASOURCE_USERNAME=cymelle \
SPRING_DATASOURCE_PASSWORD=cymelle \
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000 \
./gradlew bootRun
```

Frontend:

```sh
cd orders-frontend
corepack enable
pnpm install
VITE_API_BASE_URL=http://localhost:8080/api pnpm dev
```

## Development Checks

Backend tests:

```sh
cd orders-backend
./gradlew test
```

Frontend checks:

```sh
cd orders-frontend
pnpm test
pnpm lint
pnpm check
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Render deployment steps. The deployed setup uses:

- `cymelle-api`: Spring Boot API Docker service
- `cymelle-web`: TanStack/Nitro frontend Docker service
- Neon PostgreSQL through `DATABASE_URL`

## Real-Time Location Design

See [PART_2.md](./PART_2.md) for the proposed backend architecture for real-time location updates across delivery and ride trips.
