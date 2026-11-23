FROM php:8.3-cli-alpine

RUN apk add --no-cache git unzip libpq-dev postgresql-dev oniguruma-dev libicu-dev \
    && docker-php-ext-install pdo_pgsql pdo_sqlite bcmath mbstring intl opcache \
    && apk del postgresql-dev oniguruma-dev libicu-dev

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY composer.json ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000
CMD sh -c "php artisan migrate --seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"
