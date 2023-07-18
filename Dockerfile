FROM node:16-alpine
WORKDIR /DMS-Server
COPY package*.json ./
RUN apk add --no-cache python3 py3-pip make g++
RUN npm install
COPY . .
RUN npm run build
