const { createProxyMiddleware } = require('http-proxy-middleware');

// This is required for Axios to work in production environment and not point to static ports

module.exports = function(app) {
  app.use(
    '/api/**',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );
};

