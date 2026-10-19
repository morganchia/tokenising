const path = require('path');
const WebpackDevServer = require('webpack-dev-server');

const uuidV4Shim = path.resolve(__dirname, 'shims/uuid-v4.js');

// webpack-dev-server 5 removed close(); react-scripts 5 still calls it on Ctrl+C / stdin end.
if (!WebpackDevServer.prototype.close) {
  WebpackDevServer.prototype.close = function () {
    return this.stop();
  };
}

module.exports = {
  jest: {
    configure: (jestConfig) => {
      jestConfig.moduleNameMapper = {
        ...jestConfig.moduleNameMapper,
        '^uuid/v4$': uuidV4Shim,
        // Jest 27 ignores package "exports"; react-router-dom 7 imports this subpath.
        '^react-router/dom$': '<rootDir>/node_modules/react-router/dist/development/dom-export.js',
      };
      return jestConfig;
    },
  },
  webpack: {
    alias: {
      'uuid/v4': uuidV4Shim,
    },
    configure: (webpackConfig) => {
      // Exclude node_modules from source-map-loader so it doesn't fail with ENOENT
      // when webpack resolves packages from the root node_modules instead of client/node_modules.
      const smRule = webpackConfig.module.rules.find(
        r => r.enforce === 'pre' && Array.isArray(r.use) &&
             r.use.some(u => u.loader && u.loader.includes('source-map-loader'))
      ) || webpackConfig.module.rules.find(
        r => r.enforce === 'pre' && r.loader && r.loader.includes('source-map-loader')
      );
      if (smRule) {
        const existing = smRule.exclude
          ? (Array.isArray(smRule.exclude) ? smRule.exclude : [smRule.exclude])
          : [];
        smRule.exclude = [...existing, /node_modules/];
      }
      webpackConfig.ignoreWarnings = [/Failed to parse source map/];
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    const { onBeforeSetupMiddleware, onAfterSetupMiddleware } = devServerConfig;
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;
    // webpack-dev-server 5 replaced the `https` option with `server`.
    const { https } = devServerConfig;
    delete devServerConfig.https;
    devServerConfig.server = !https ? 'http' : typeof https === 'object' ? { type: 'https', options: https } : 'https';
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // react-dev-utils' error-overlay middleware reads the v4 private `_stats`; v5 exposes `stats`.
      if (!('_stats' in devServer)) {
        Object.defineProperty(devServer, '_stats', { get() { return this.stats; } });
      }
      if (onBeforeSetupMiddleware) onBeforeSetupMiddleware(devServer);
      if (onAfterSetupMiddleware) {
        middlewares.push({
          name: 'after-middlewares',
          middleware: (_req, _res, next) => {
            onAfterSetupMiddleware(devServer);
            next();
          },
        });
      }
      return middlewares;
    };
    return devServerConfig;
  },
};
