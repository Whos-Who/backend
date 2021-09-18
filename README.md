# CS3216 Assignment 3

Backend repository for the assignment 3

## Table of content

- [CS3216 Assignment 3](#cs3216-assignment-3)
  - [Table of content](#table-of-content)
  - [Environment Set up](#environment-set-up)
    - [Installing Dependencies](#installing-dependencies)
    - [Docker Set Up](#docker-set-up)
    - [Running Redis locally](#running-redis-locally)
    - [Running PostgreSQL locally](#running-postgresql-locally)
    - [Running migrations](#running-migrations)
  - [Running seed files](#running-seed-files)
    - [Linting, Formatting and CI Check](#linting-formatting-and-ci-check)
  - [Deployment](#deployment)
  - [Documentation](#documentation)
    - [REST API endpoints](#rest-api-endpoints)
    - [Socket Listeners and Emitters](#socket-listeners-and-emitters)
    - [Redis Key-value mappings](#redis-key-value-mappings)

## Environment Set up

### Installing Dependencies

1. Install Node V12 and Docker
2. Clone this repository to your directory
3. Navigate into the `backend` directory
4. Run `npm install`
5. To run server with `nodemon`, run `npm run dev`
6. Alternatively, you can run `npm start` to run without `nodemon`

### Docker Set Up

1. Change rename `.env.example` to `.env`, which will be used to set the environment variables
2. Run `docker-compose up` to build docker image and run docker container for PostgreSQL Database
3. Hit Ctrl-c to exit
4. To remove your container, run `docker compose down`

### Running Redis locally

1. Make sure your docker container is running, if not set up yet, refer to the above section
2. Install `redis-cli` on you terminal
3. After successfully installing, run `redis-cli`, enter `PING`
4. If your Redis Server replies with `PONG`, your Redis Server is running correctly

### Running PostgreSQL locally

1. Make sure your docker container is running, if not set up yet, refer to the above section
2. You can use a Database Management tool like PgAdmin or SequelPro to connect to the local PostgreSQL
3. Connect to the server with the following settings:

- Database: assignment-3
- Host: localhost
- Port: 5432

### Running migrations

To update your local database with the latest schemas, run `npx sequelize-cli db:migrate`

## Running seed files

To update your local database with the latest seed data, like default decks, run `npx sequelize-cli db:seed:all`

### Linting, Formatting and CI Check

1. Install Prettier extension on VSCode
2. Set it as your code formatter and set it to format document on save (which will make things easier)
3. Code should be auto-formatted on save
4. ESlint is installed to maintain some code style (used the lowest requirement), which adheres to the Prettier style formatter
5. CI check enforced just for linting

## Deployment

1. Configured auto deployment when there are changes to main branch
2. Check environment `assignment-3-web-backend` to check deployment status

## Documentation

### REST API endpoints

[REST API](https://cs3216assignment3.docs.apiary.io/)

### Socket Listeners and Emitters

[Socket Listeners and Emitters](docs/Socket.Events.md)

### Redis Key-value mappings

[Redis key-value storage](docs/Redis.Storage.md)
