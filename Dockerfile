# Make a docker container using node 18
FROM node:18

# Set the working directory to /app
WORKDIR /app

COPY package.json /app

RUN yarn install

# Copy the current directory contents into the container at /app
COPY . /app

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run yarn run run when the container launches
CMD ["yarn", "run", "run"]
