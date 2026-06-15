# Render deployment

This repository is configured for two Docker-backed Render web services:

- `cymelle-api`: Spring Boot API
- `cymelle-web`: TanStack/Nitro frontend

No PostgreSQL container or Render database is created. Use your Neon database connection string.

## Render setup

1. Create a new Blueprint on Render using `render.yaml`.
2. When Render asks for `DATABASE_URL`, paste your Neon pooled PostgreSQL connection string.
   - A Neon URL like `postgresql://user:password@host/db?sslmode=require` is accepted.
   - A Neon JDBC URL like `jdbc:postgresql://host/db?user=...&password=...&sslmode=require` is also accepted.
3. Deploy both services.
4. If Render assigns different service URLs than the defaults in `render.yaml`, update:
   - `cymelle-api` -> `APP_CORS_ALLOWED_ORIGINS` to the frontend URL.
   - `cymelle-web` -> `VITE_API_BASE_URL` to the API URL plus `/api`.

## Local Docker builds

Build the API:

```sh
docker build -t cymelle-api ./orders-backend
```

Run the API with Neon:

```sh
docker run --rm -p 8080:8080 \
  -e DATABASE_URL='postgresql://user:password@host/db?sslmode=require' \
  -e APP_CORS_ALLOWED_ORIGINS='http://localhost:3000' \
  cymelle-api
```

Build the frontend:

```sh
docker build -t cymelle-web \
  --build-arg VITE_API_BASE_URL=http://localhost:8080/api \
  ./orders-frontend
```

Run the frontend:

```sh
docker run --rm -p 3000:3000 cymelle-web
```
