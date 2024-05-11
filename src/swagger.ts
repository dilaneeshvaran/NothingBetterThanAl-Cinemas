import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nothing Better Than AL Cinemas',
      version: '1.0.0',
      description: 'A simple API for a cinema managing system (tickets/auditorium/scheduling etc..)',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/handlers/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };