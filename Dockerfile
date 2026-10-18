FROM node:24.21.0-slim AS frontend
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
COPY app/package.json app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY app/ ./
ENV VITE_API_URL=/api
ARG VITE_CONTACT_EMAIL=hansard@fancybinary.sg
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
ARG VITE_RESEARCHERS_FORM_URL=
ENV VITE_RESEARCHERS_FORM_URL=$VITE_RESEARCHERS_FORM_URL
ARG VITE_ANALYTICS_URL=
ENV VITE_ANALYTICS_URL=$VITE_ANALYTICS_URL
RUN pnpm build

FROM python:3.15-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /usr/local/bin/uv
ENV UV_PYTHON_DOWNLOADS=never
WORKDIR /api
COPY api/pyproject.toml api/uv.lock api/.python-version ./
RUN uv sync --frozen --no-dev
COPY api/ ./
COPY --from=frontend /app/dist /frontend
ENV FRONTEND_DIST_PATH=/frontend
RUN useradd --create-home --uid 10001 hansard
USER hansard
EXPOSE 8080
CMD ["uv", "run", "--no-sync", "fastapi", "run", "website.py", "--port", "8080", "--proxy-headers"]
