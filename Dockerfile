FROM oven/bun:1

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN bun install

# Copy tsconfig
COPY tsconfig.json ./

# Explicitly copy the entire src directory
COPY src/ ./src/

# List files to verify (debugging)
RUN ls -la
RUN ls -la src/
RUN ls -la src/analyzers/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
