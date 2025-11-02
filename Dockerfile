FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN bun install

# Copy ALL source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "run", "src/index.ts"]
