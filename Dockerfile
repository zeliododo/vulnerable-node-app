
FROM node:23.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "eval \"$(echo 'node app.js')\""]

