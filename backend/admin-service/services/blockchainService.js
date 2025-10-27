const axios = require('axios');

const BLOCKCHAIN_SVC = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011';

// Helper function for HTTP requests
const http = axios.create({
  baseURL: BLOCKCHAIN_SVC,
  timeout: 8000,
});

function svcGet(path, { req, params = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.get(path, { params, headers });
}

function svcPost(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.post(path, data, { headers });
}

function svcPut(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.put(path, data, { headers });
}

function svcDelete(path, { req } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.delete(path, { headers });
}

module.exports = {
  svcGet,
  svcPost,
  svcPut,
  svcDelete
};