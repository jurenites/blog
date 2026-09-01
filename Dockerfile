FROM drupal:11-php8.4-apache

RUN apt-get update \
  && apt-get install -y --no-install-recommends git unzip mariadb-client \
  && rm -rf /var/lib/apt/lists/*

COPY docker/php-upload.ini /usr/local/etc/php/conf.d/jurenites-upload.ini
COPY docker/apache-upload.conf /etc/apache2/conf-available/jurenites-upload.conf

RUN a2enconf jurenites-upload

WORKDIR /opt/drupal
