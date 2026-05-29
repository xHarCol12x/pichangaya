FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install

COPY prisma ./prisma
COPY nest-cli.json tsconfig*.json ./
COPY src ./src

EXPOSE 3001

CMD ["sh", "-c", "pnpm prisma generate && pnpm run start:dev"]
