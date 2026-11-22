FROM php:8.3-cli-alpine

RUN apk add --no-cache git unzip libpq-dev postgresql-dev \
    && docker-php-ext-install pdo_pgsql pdo_sqlite bcmath \
    && apk del postgresql-dev

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
