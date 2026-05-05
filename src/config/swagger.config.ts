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
        schemas: {
          StoreTheme: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              storeName: { type: 'string' },
              logoUrl: { type: 'string' },
              primaryColor: { type: 'string' },
              buttonColor: { type: 'string' },
              bgColor: { type: 'string' },
              fontFamily: { type: 'string' },
              ctaText: { type: 'string' },
              borderRadius: { type: 'number' },
              instagramUrl: { type: 'string' },
              tiktokUrl: { type: 'string' },
            },
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              imageUrl: { type: 'string' },
              stock: { type: 'number' },
            },
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
