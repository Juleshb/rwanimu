let ready;

function server() {
  if (!ready) {
    ready = (async () => {
      const { NestFactory } = require('@nestjs/core');
      const { AppModule } = require('../dist/app.module');
      const app = await NestFactory.create(AppModule);
      app.enableCors({ origin: true, credentials: true });
      app.setGlobalPrefix('api');
      await app.init();
      return app.getHttpAdapter().getInstance();
    })();
  }
  return ready;
}

module.exports = async (req, res) => {
  try {
    const url = req.url || '/';
    if (!url.startsWith('/api')) req.url = '/api' + (url.startsWith('/') ? url : `/${url}`);
    const expressApp = await server();
    return expressApp(req, res);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      status: 'error',
      message: error && error.message ? error.message : 'API failed to start',
    }));
  }
};
