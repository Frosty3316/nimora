FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY prisma ./prisma
COPY src ./src
COPY .env.example ./.env
RUN npx prisma generate
EXPOSE 4000
ENV PORT=4000
ENV DATABASE_URL="file:./dev.db"
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
