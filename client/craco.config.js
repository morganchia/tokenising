module.exports = {
  webpack: {
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
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
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
