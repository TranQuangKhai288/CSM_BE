import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';
import envConfig from './env.config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'E-commerce Admin CMS API',
    version: '1.0.0',
    description: 'API documentation for E-commerce Admin CMS Backend',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${envConfig.get('PORT')}${envConfig.get('API_PREFIX')}`,
      description: 'Development server',
    },
    {
      url: `https://api.example.com${envConfig.get('API_PREFIX')}`,
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Success message',
          },
          data: {
            type: 'object',
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            example: 100,
          },
          page: {
            type: 'integer',
            example: 1,
          },
          pageSize: {
            type: 'integer',
            example: 20,
          },
          totalPages: {
            type: 'integer',
            example: 5,
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management' },
    { name: 'Roles', description: 'Role management' },
    { name: 'Categories', description: 'Category management' },
    { name: 'Products', description: 'Product management' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Customers', description: 'Customer management' },
    { name: 'Inventory', description: 'Inventory management' },
    { name: 'Discounts', description: 'Discount management' },
    { name: 'Media', description: 'Media/File management' },
    { name: 'Content', description: 'Content management' },
    { name: 'Settings', description: 'System settings' },
    { name: 'Analytics', description: 'Analytics and reports' },
  ],
};

const swaggerOptions: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/modules/**/*.ts', './src/modules/**/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-commerce CMS API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};
