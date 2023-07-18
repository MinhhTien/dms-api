FROM node:16-alpine
WORKDIR /DMS-Server
COPY package*.json ./
RUN npm cache clean --force
RUN npm install
COPY . .
RUN npm run build
