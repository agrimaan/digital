pull repo code from https://github.com/agrimaan/digital
git clone https://github.com/agrimaan/digital



infrastructure
1. Mongodb
docker-compose up mongodb

2. API Gateway (needed for admin-ui, runs on port 3012)
cd /opt/agm/digital/infrastructure/api-gateway 
npm i && npm start
3. Consul Server
cd /opt/agm/digital/infrastructure/consul-server (runs on port 3012)
docker-compose up consul-server


#backend services
1. Admin-Service: needed for admin-ui, runs on port 3012
cd /opt/agm/digital/backend/admin-service 
npm i && npm start
2. User-Service: needed for admin-ui, runs on port 3002
cd /opt/agm/digital/backend/user-service ()
npm i && npm start


cd /opt/agm/digital/backend/analytics-service
npm i && npm start
cd /opt/agm/digital/backend/blockchain-service
npm i && npm start
cd /opt/agm/digital/backend/crop-service
npm i && npm start
cd /opt/agm/digital/backend/field-service
npm i && npm start
cd /opt/agm/digital/backend/iot-service
npm i && npm start
cd /opt/agm/digital/backend/logistics-service
npm i && npm start
cd /opt/agm/digital/backend/marketplace-service
npm i && npm start
cd /opt/agm/digital/backend/notification-service
npm i && npm start

cd /opt/agm/digital/backend/weather-service
npm i && npm start


Frontend
cd /opt/agm/digital/backend/admin-ui ( runs on port 5006)
npm i && npm start

