# Wuphf

Wuphf is a social networking application built with Next.js, TypeScript, Prisma, and PostgreSQL. It supports user accounts, following and followers, posts (Wuphfs), comments, and likes.

## Prerequisites

Install the following software:

1. [Git](https://git-scm.com/downloads) — to clone the repository.
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) — to run the application and PostgreSQL database using Docker Compose.

Node.js and PostgreSQL do not need to be installed separately for the Docker-based development workflow.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cpg55850/WuphfTest.git Wuphf
cd Wuphf
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and configure the environment variables required by the application.

```bash
cp .env.example .env
```

Configure the credentials and settings required by the application, including:

- **Database:** PostgreSQL connection URL.
- **Authentication:** Google OAuth client credentials, if required by the authentication configuration.
- **Cloudinary:** Credentials for image uploads and media management, if required by the application.

For the Docker Compose setup, the database hostname is `db`, the database name is `wuphf`, and the default local PostgreSQL credentials are `postgres` / `postgres`.

For example, the database connection URL may be:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/wuphf?schema=public"
```

Use the actual variable names expected by the project's Prisma and authentication configuration. Do not commit `.env` or real credentials to version control.

### 3. Start the application

Make sure Docker Desktop is running, then execute:

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL and waits for its health check to pass before starting the application. The application container then:

1. Applies existing Prisma migrations with `prisma migrate deploy`.
2. Seeds the database with `prisma db seed`.
3. Starts the Next.js development server with `npm run dev`.

The application is available at [http://localhost:3000](http://localhost:3000).

PostgreSQL is exposed on port `5432` for local development tools.

### 4. Stop the application

Press `Ctrl+C` in the terminal running Docker Compose, then execute:

```bash
docker compose down
```

The PostgreSQL data is persisted in the `postgres-data` Docker volume, so stopping the containers does not normally delete the database.

To remove the containers and **permanently delete the persisted local database volume**, run:

```bash
docker compose down -v
```

Use this command only when you intend to reset the local database completely.

## Development Workflow

### Application logs

View the application logs with:

```bash
docker compose logs -f app
```

View the PostgreSQL logs with:

```bash
docker compose logs -f db
```

### Prisma and database migrations

The application automatically applies existing migrations when its container starts.

To create a new migration during development, run the following command, replacing the example migration name with a description of your change:

```bash
docker compose run --rm app npx prisma migrate dev --name add_feature
```

Commit the resulting migration files so other developers and deployment environments can apply the same schema changes.

Useful Prisma commands:

| Command                     | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| `npx prisma migrate dev`    | Creates and applies migrations during development.      |
| `npx prisma migrate deploy` | Applies existing migrations in deployment environments. |
| `npx prisma db seed`        | Runs the configured database seed script.               |
| `npx prisma studio`         | Opens Prisma Studio to inspect database records.        |
| `npx prisma generate`       | Generates the Prisma Client.                            |

These commands can be run inside the application container when the required dependencies and database are available.

**Note:** The Compose startup command runs the seed script on each application-container startup. Ensure that the seed script is safe to rerun if repeated starts should not create duplicate records.

**⚠️ Warning: Database seeding is destructive.**

The configured seed script begins by executing a PostgreSQL `TRUNCATE ... RESTART IDENTITY CASCADE` statement against the `Comments`, `Likes`, `Follower`, `Wuphf`, `WuphfUser`, `User`, and `Avatar` tables. This **deletes all existing records in those tables and resets their auto-incrementing ID counters** before inserting the sample data.

The Docker Compose startup command runs `npx prisma db seed` every time the application container starts. As a result, restarting or recreating the application container will erase existing data in these tables and repopulate the database with the seed script's sample users, posts, comments, likes, follows, and avatars.

**Use this setup only with a disposable development database. Do not point it at a production database or any database containing data you need to preserve.**

## Project Links

- [GitHub Repository](https://github.com/cpg55850/WuphfTest)
- [Jira Project Board](https://cpg55850.atlassian.net/jira/software/projects/THEP/boards/1)
- [Cloudinary Console](https://cloudinary.com/console/c-e4ff7ac8f9bcfcbc03dd0324aec080)
- [Deployment](https://wuphf-test.vercel.app/)
- [Figma Design](https://www.figma.com/file/esvIWUvBkJmtutM1PBGZgb/Wuphf)

## Site Colors

| Hex       | Color        |
| --------- | ------------ |
| `#f4f4f3` | White        |
| `#72d0ed` | Light blue   |
| `#747378` | Gray         |
| `#7395b0` | Dark blue    |
| `#202e4a` | Darkest blue |

![Color Palette](./asssets/ColorPallete.png)

## References

- [Git documentation](https://confluence.atlassian.com/bitbucketserver/basic-git-commands-776639767.html)
- [npm CLI documentation](https://docs.npmjs.com/cli/)
- [Prisma documentation](https://www.prisma.io/docs/)

## API Manual

Unless otherwise specified, the endpoints below describe the intended behavior of the API. Actual responses and authentication requirements depend on the route implementation.

### `/me`

| Method | Description                                                                   |
| ------ | ----------------------------------------------------------------------------- |
| GET    | Retrieves the currently authenticated user from the session.                  |
| POST   | Not supported.                                                                |
| PATCH  | Updates the currently authenticated user.                                     |
| DELETE | Deletes the currently authenticated user, if supported by the implementation. |

### `/users`

| Method | Description                            |
| ------ | -------------------------------------- |
| GET    | Retrieves users.                       |
| POST   | Creates a user with the supplied data. |
| PATCH  | Not supported.                         |
| DELETE | Not supported.                         |

### `/users/[uid]`

`uid` is the user's username.

Example: `/users/johndoe`

| Method | Description                   |
| ------ | ----------------------------- |
| GET    | Retrieves the specified user. |
| POST   | Not supported.                |
| PATCH  | Updates the specified user.   |
| DELETE | Deletes the specified user.   |

### `/users/[uid]/wuphfs`

| Method | Description                                                                      |
| ------ | -------------------------------------------------------------------------------- |
| GET    | Retrieves posts created by the specified user.                                   |
| POST   | Not supported.                                                                   |
| PATCH  | Not supported.                                                                   |
| DELETE | Deletes posts created by the specified user, if supported by the implementation. |

### `/users/[uid]/following`

| Method | Description                                                                             |
| ------ | --------------------------------------------------------------------------------------- |
| GET    | Retrieves the users followed by the specified user, if supported by the implementation. |
| POST   | Follows the specified user.                                                             |
| PATCH  | Not supported.                                                                          |
| DELETE | Unfollows the specified user.                                                           |

### `/users/[uid]/followers`

| Method | Description                                    |
| ------ | ---------------------------------------------- |
| GET    | Retrieves the followers of the specified user. |
| POST   | Not supported.                                 |
| PATCH  | Not supported.                                 |
| DELETE | Not supported.                                 |

### `/wuphfs`

| Method | Description                   |
| ------ | ----------------------------- |
| GET    | Retrieves posts across users. |
| POST   | Creates a post.               |
| PATCH  | Not supported.                |
| DELETE | Not supported.                |

### `/wuphfs/[wid]`

`wid` identifies a post.

Example: `/wuphfs/1`

| Method | Description                   |
| ------ | ----------------------------- |
| GET    | Retrieves the specified post. |
| POST   | Not supported.                |
| PATCH  | Updates the specified post.   |
| DELETE | Deletes the specified post.   |

### `/wuphfs/[wid]/comments`

| Method | Description                                |
| ------ | ------------------------------------------ |
| GET    | Retrieves comments for the specified post. |
| POST   | Creates a comment on the specified post.   |
| PATCH  | Not supported.                             |
| DELETE | Not supported.                             |

### `/wuphfs/[wid]/comments/[cid]`

`cid` identifies a comment on the specified post.

| Method | Description                      |
| ------ | -------------------------------- |
| GET    | Retrieves the specified comment. |
| POST   | Not supported.                   |
| PATCH  | Updates the specified comment.   |
| DELETE | Deletes the specified comment.   |
