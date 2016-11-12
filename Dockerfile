FROM mhart/alpine-node:7
MAINTAINER 	Phani Pasupula <pasupulaphani@gmail.com>

# Setup lib
WORKDIR /lib
ADD . .

RUN npm install yarn && ./node_modules/.bin/yarn
