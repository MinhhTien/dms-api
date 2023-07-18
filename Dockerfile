FROM node:16-alpine
WORKDIR /DMS-Server
COPY package*.json ./
RUN npm install -g npm@9.8.0
RUN npm install
COPY . .
RUN npm run build
