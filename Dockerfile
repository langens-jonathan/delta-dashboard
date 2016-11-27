FROM node

MAINTAINER Langens Jonathan <flowofcontrol@gmail.com>

ADD . /app

WORKDIR /app

RUN npm install express

EXPOSE 3000

CMD ["node", "server.js"]
