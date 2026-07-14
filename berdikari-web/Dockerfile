FROM node:22-alpine

WORKDIR /app

RUN npm install -g npm@latest

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 3000"]
