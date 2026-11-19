FROM public.ecr.aws/docker/library/node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8089

CMD ["npm", "start"]