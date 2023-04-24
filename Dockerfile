FROM node:20 AS frontend

RUN mkdir -p /fe
WORKDIR /fe
COPY frontend /fe
RUN npm install
RUN npm run build

FROM ubuntu:23.04
ENV DEBIAN_FRONTEND noninteractive

LABEL org.opencontainers.image.title "StoryWeb"
LABEL org.opencontainers.image.licenses MIT
LABEL org.opencontainers.image.source https://github.com/opensanctions/storyweb

RUN apt-get -qq -y update \
    && apt-get -qq -y upgrade \
    && apt-get -qq -y install locales ca-certificates tzdata curl python3-pip \
    python3-icu python3-cryptography libicu-dev pkg-config postgresql-client-common \
    postgresql-client libpq-dev \
    && apt-get -qq -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 \
    && ln -fs /usr/share/zoneinfo/Etc/UTC /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata

ENV LANG='en_US.UTF-8' \
    TZ="UTC" \
    API_URL="/api/1"

RUN pip install -U pip setuptools wheel
RUN pip install spacy
RUN python3 -m spacy download en_core_web_sm
RUN python3 -m spacy download de_core_news_sm
RUN python3 -m spacy download xx_ent_wiki_sm
RUN python3 -m spacy download ru_core_news_sm

RUN mkdir -p /storyweb
WORKDIR /storyweb
COPY . /storyweb
RUN pip install --no-cache-dir -e /storyweb
COPY --from=frontend /fe/build /storyweb/frontend/build

CMD ["uvicorn", "--host", "0.0.0.0", "storyweb.server:app"]