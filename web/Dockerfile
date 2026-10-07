FROM node:22

WORKDIR /server

COPY web/package.json ./

RUN npm install

COPY web ./web
COPY common ./common

EXPOSE 3000

CMD ["npm", "start"]