FROM node:10.16.3
EXPOSE 8888
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN mkdir -p /usr/src/app/build/upload/images

RUN npm prune && npm install

CMD ["npm", "start"]
