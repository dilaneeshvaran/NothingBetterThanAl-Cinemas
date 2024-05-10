const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  swaggerDefinition: {
    info: {
      title: 'Nothing Better Than AL Cinemas',
      version: '1.0.0',
      description: 'A simple API for a cinema managing system (tickets/auditorium/scheduling etc..)',
    },
    basePath: '/',
    components: {
      schemas: {},
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

module.exports = { swaggerUi, specs };