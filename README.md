# CS3216 Assignment 3

Backend repository for the assignment 3

## Environment Set up

### Installing dependencies

1. Install Node V12 and Docker
2. Clone this repository to your directory
3. Navigate into the `backend directory
4. Run `npm install`
5. To run server with `nodemon`, run `npm run dev`
6. Alternatively, you can run `npm start` to run without `nodemon`

### Docker Set Up

1. Change rename `.env.example` to `.env`, which will be used to set the environment variables
2. Run `docker-compose up` to build docker image and run docker container for PostgreSQL Database
3. Hit Ctrl-c to exit

### Linting, Formatting and CI Check

1. Install Prettier extension on VSCode
2. Set it as your code formatter and set it to format document on save (which will make things easier)
3. Code should be formatted on save
4. ESlint is installed to do some maintain some code style (used the lowest requirement), which adheres to the Prettier style formatter
5. CI check enforced just for linting

### Deployment

1. Configured auto deployment when there are changes to main branch
2. Check environment `assignment-3-web-backend ` to check deployment status
