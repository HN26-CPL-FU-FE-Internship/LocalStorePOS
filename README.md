# Restaurant POS

Restaurant POS application with a Spring Boot backend, React/Vite frontend, MySQL, and Cloudinary asset storage.

## Requirements

- Java 17+
- Node.js 20+
- npm
- Docker and Docker Compose (recommended for local MySQL)

## Profiles

The backend has two separate Spring profiles:

- `local`: local/Docker MySQL defaults, verbose SQL logging, localhost CORS.
- `prod`: production database, required secrets, restricted CORS, and production logging.

Shared defaults are in `backend/src/main/resources/application.yml`. Profile overrides are in:

```text
backend/src/main/resources/application-local.yml
backend/src/main/resources/application-prod.yml
```

Never put real production credentials in YAML or commit a real `.env` file.

## Local setup

1. Start MySQL:

```bash
docker compose --profile local up -d mysql
```

2. Configure the backend. The defaults work with the compose database, but Cloudinary is required for image upload:

```bash
cd backend
cp .env.example .env
# Spring Boot does not automatically load a plain .env file:
set -a
source .env
set +a
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Alternatively, run with the profile explicitly:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

3. Configure and run the frontend in another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The local frontend uses `http://localhost:8080/restaurant-pos/api` by default. The local Compose database uses `root` / `1234` unless you change both the Compose variables and backend environment consistently.

## Production setup

Set these variables in your deployment platform or secret manager:

```bash
SPRING_PROFILES_ACTIVE=prod
DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=restaurant_pos_db
DB_USERNAME=restaurant_pos_app
DB_PASSWORD=...
JWT_SIGNER_KEY=...
CORS_ALLOWED_ORIGINS=https://your-frontend.example.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Start the packaged backend with:

```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/restaurant-pos-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Or use the production Docker template after providing the variables above:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Build the production frontend with a real, uncommitted `.env.production` file:

```bash
cd frontend
cp .env.production.example .env.production
# Set VITE_API_URL to the public production API URL
npm run build
```

## Validation

```bash
cd backend && ./mvnw -DskipTests package
cd ../frontend && npm run build
```

The backend context path is `/restaurant-pos`; the frontend base path is also `/restaurant-pos`.
