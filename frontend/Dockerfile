FROM node:20-slim

# Install system dependencies required by SWC and node-gyp
RUN apt-get update && \
    apt-get install -y curl python3 make g++ && \
    npm install -g pnpm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies using pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy all remaining project files
COPY . .

# Expose Next.js dev port
EXPOSE 3000

CMD ["pnpm", "dev", "--port", "3000"]
