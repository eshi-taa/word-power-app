# Base Node.js image
FROM node:20-slim AS builder

# Install OpenSSL (required by Prisma Client)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package descriptors and lockfiles
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose server port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
