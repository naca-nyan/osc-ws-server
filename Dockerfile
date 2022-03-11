FROM node:16

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY main.js ./

EXPOSE 5000
CMD [ "node", "main.js" ]
