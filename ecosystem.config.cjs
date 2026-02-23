module.exports = {
  apps: [
    {
      name: 'nav-map-api',
      script: 'apps/api/src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '4000'
      }
    }
  ]
};
