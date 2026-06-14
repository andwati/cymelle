# Cymelle

## Local Docker Compose

Run the full local development stack with Postgres 18, Spring Boot API, and TanStack/Vite web app:

```sh
cp .env.example .env
docker compose up
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Postgres: `localhost:5432`, database/user/password `cymelle`

Paystack checkout requires test keys in `.env`:

```sh
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_CALLBACK_URL=http://localhost:3000/payments/paystack/callback
```

Useful commands:

```sh
docker compose logs -f api
docker compose logs -f web
docker compose restart api
docker compose down
docker compose down -v
```

The web service runs Vite from mounted source, so frontend edits reload without rebuilding. Restart `api` after backend code changes. Use `docker compose down -v` only when you want to delete the local Postgres and dependency cache volumes.
