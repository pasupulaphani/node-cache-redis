FROM mhart/alpine-node:7
MAINTAINER 	Phani Pasupula <pasupulaphani@gmail.com>

# Setup lib
WORKDIR /lib
ADD . .

# Install Yarn
ENV PATH /root/.yarn/bin:$PATH
RUN apk update \
  && apk add curl bash binutils tar \
  && rm -rf /var/cache/apk/* \
  && /bin/bash \
  && touch ~/.bashrc \
  && curl -o- -L https://yarnpkg.com/install.sh | bash \
  && apk del curl tar binutils

RUN yarn install --pure-lockfile --ignore-optional
