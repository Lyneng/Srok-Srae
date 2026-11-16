'use strict';
// Vercel Serverless Function entrypoint
const { handleRequest } = require('../server.js');

module.exports = async (req, res) => {
  return handleRequest(req, res);
};
