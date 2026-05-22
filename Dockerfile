FROM drupal:11-php8.4-apache

RUN apt-get update \
  && apt-get install -y --no-install-recommends git unzip mariadb-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/drupal
