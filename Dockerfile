FROM node:7.1.0
EXPOSE 8888
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm prune && npm install
COPY . /usr/src/app

RUN /usr/src/app/start.sh
