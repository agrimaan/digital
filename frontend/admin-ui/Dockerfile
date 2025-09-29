FROM node:18-alpine AS build
WORKDIR /app

# Copy shared library first
#COPY shared ../../shared/


COPY package*.json ./
RUN npm cache clean --force && npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5006
CMD ["nginx", "-g", "daemon off;"]
