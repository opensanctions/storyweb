FROM node:18 AS frontend

RUN mkdir -p /fe
WORKDIR /fe
COPY frontend /fe
RUN npm install
RUN npm run build

FROM ubuntu:22.04
ENV DEBIAN_FRONTEND noninteractive

LABEL org.opencontainers.image.title "StoryWeb"
LABEL org.opencontainers.image.licenses MIT
LABEL org.opencontainers.image.source https://github.com/opensanctions/storyweb

RUN apt-get -qq -y update \
    && apt-get -qq -y upgrade \
    && apt-get -qq -y install locales ca-certificates tzdata curl python3-pip \
    python3-icu python3-cryptography libicu-dev pkg-config \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 \
    && ln -fs /usr/share/zoneinfo/Etc/UTC /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata

ENV LANG='en_US.UTF-8' \
    TZ="UTC"

RUN mkdir -p /storyweb
WORKDIR /storyweb
COPY . /storyweb
RUN pip install --no-cache-dir -e /storyweb
COPY --from=frontend /fe/build /storyweb/frontend/build

CMD ["uvicorn", "storyweb.server:app"]