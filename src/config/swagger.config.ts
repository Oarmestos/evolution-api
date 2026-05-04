import { ConfigService } from './env.config';

export const getSwaggerOptions = (configService: ConfigService) => {
  const httpServer = configService.get<{ URL: string; PORT: number }>('SERVER');

  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Evolution API',
        version: '2.3.7',
        description: 'Evolution API - WhatsApp Multi-Tenant Platform',
        contact: {
          name: 'Evolution API',
          url: 'https://doc.avri.com',
        },
      },
      servers: [
        {
          url: httpServer.URL || `http://localhost:${httpServer.PORT}`,
          description: 'API Server',
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'apikey',
            description: 'Global API Key or Instance Token',
          },
        },
      },
      security: [
        {
          apiKey: [],
        },
      ],
    },
    apis: ['./dist/api/routes/*.js'],
  };
};
