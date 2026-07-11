# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

# Install postgresql-client for pg_dump and psql
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./
RUN chmod +x start.sh

# Compile seed.ts to JS for prisma db seed in production
COPY --from=builder /app/prisma/seed.ts ./prisma/seed.ts
RUN npx tsc prisma/seed.ts --outDir dist --module commonjs --target es2022 --esModuleInterop --skipLibCheck --resolveJsonModule 2>/dev/null; exit 0

ENV PORT=3001
EXPOSE 3001

CMD ["./start.sh"]
