# Use the official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy dependency definitions and prisma schema first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install any needed packages specified in package.json
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Bundle app source inside Docker image
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV development