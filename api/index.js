'use strict';
// Vercel Serverless Function entrypoint
const server = require('../server.js');

module.exports = async (req, res) => {
  return server(req, res);
};
