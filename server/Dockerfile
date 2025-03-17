FROM --platform=linux/arm64 node:23-alpine
WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm install
COPY . .


RUN npm rebuild bcrypt --build-from-source




CMD ["sh", "-c", "npm run knex migrate:latest --knexfile knexfile.mjs && npm run build && npm run start"]