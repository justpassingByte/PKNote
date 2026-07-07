# PoNotes - Local Docker Deployment

This guide explains how to build and run the PoNotes application (both backend and frontend) locally using Docker Desktop.

## Prerequisites

1.  **Docker Desktop:** Ensure you have Docker Desktop installed and running on your machine.
2.  **Environment Variables:** Create a `.env` file in the root directory. You can copy the provided `.env.example` file:
    ```bash
    cp .env.example .env
    ```
    *Note: The `.env.example` is configured to work out-of-the-box for local Docker deployments. Fill in any external API keys (Groq, Resend, NowPayments, etc.) if you need those features.*

## Building and Running the Application

To build the images and start all services, open a terminal in the root directory (where the `docker-compose.yml` file is located) and run:

```bash
docker-compose up --build -d
```

This command will:
1.  Build the backend Node.js API image.
2.  Build the frontend Next.js standalone image.
3.  Build the Python OCR API and Worker images.
4.  Start all services including Postgres, Redis, and an Nginx reverse proxy.
5.  Run them in detached mode (`-d`), so they run in the background.

## Accessing the Application

Once the containers are up and running, you can access the application through the Nginx reverse proxy, which binds to port 80:

*   **Frontend UI:** [http://localhost](http://localhost)
*   **Backend API:** [http://localhost/api](http://localhost/api) (e.g., [http://localhost/health](http://localhost/health))

## Managing the Services

*   **View Logs:**
    To see the logs for all services:
    ```bash
    docker-compose logs -f
    ```
    To see logs for a specific service (e.g., the backend):
    ```bash
    docker-compose logs -f backend
    ```

*   **Stop the Services:**
    To stop the running containers without removing them:
    ```bash
    docker-compose stop
    ```

*   **Tear Down the Environment:**
    To stop and remove all containers, networks, and volumes created by `docker-compose up`:
    ```bash
    docker-compose down
    ```
    *Warning: This will not remove the named volumes (like the database volume `pgdata`) by default. To remove volumes as well, add the `-v` flag: `docker-compose down -v`.*

## Database Migrations

The backend container is configured to automatically run Prisma migrations on startup (`npx prisma migrate deploy` via `backend/start.sh`). If you need to manually interact with the database, you can execute commands inside the backend container:

```bash
docker exec -it notes_backend sh
# Inside the container:
npx prisma studio
```
