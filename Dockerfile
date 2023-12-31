FROM node:16
WORKDIR /DMS-Server
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
