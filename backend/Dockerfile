FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY seed.js ./

EXPOSE 5000

CMD ["node", "src/index.js"]