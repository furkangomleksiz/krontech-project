# Build from monorepo root: docker compose build web
FROM node:22-alpine
WORKDIR /workspace
RUN apk add --no-cache wget

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci

COPY apps/web apps/web
WORKDIR /workspace/apps/web

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_DEFAULT_LOCALE=tr
ARG NEXT_PUBLIC_SUPPORTED_LOCALES=tr,en
# Browser on the host hits the published API port (see docker-compose API_PORT).
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
# SSR + Edge middleware inside the web container call the API by Compose service name.
ARG API_INTERNAL_BASE_URL=http://api:8080/api/v1

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_PUBLIC_SUPPORTED_LOCALES=$NEXT_PUBLIC_SUPPORTED_LOCALES
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_INTERNAL_BASE_URL=$API_INTERNAL_BASE_URL

RUN npm run build

EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=25s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["npx", "next", "start", "-p", "3000"]
