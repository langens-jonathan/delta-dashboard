FROM node

MAINTAINER Langens Jonathan <flowofcontrol@gmail.com>

ADD . /app

WORKDIR /app

EXPOSE 3000

CMD ["node", "server.js"]
