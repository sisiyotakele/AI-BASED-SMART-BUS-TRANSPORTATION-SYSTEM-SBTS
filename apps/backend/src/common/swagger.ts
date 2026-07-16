/**
 * Swagger/OpenAPI documentation setup
 * 
 * To enable Swagger UI, install:
 * npm install swagger-jsdoc swagger-ui-express
 * npm install -D @types/swagger-jsdoc @types/swagger-ui-express
 */

import { config } from '@/config';

export const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Smart Bus Transportation System (SBTS) API',
        version: '1.0.0',
        description: 'Comprehensive API for managing smart bus transportation operations including fleet management, driver scheduling, route planning, real-time tracking, and incident reporting.',
        contact: {
            name: 'SBTS API Support',
            email: 'support@sbts.com',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: `http://localhost:${config.port}${config.apiPrefix}`,
            description: 'Development server',
        },
        {
            url: `https://api.sbts.com${config.apiPrefix}`,
            description: 'Production server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token in the format: Bearer <token>',
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
                    error: {
                        type: 'object',
                        properties: {
                            code: {
                                type: 'string',
                                example: 'ERROR_CODE',
                            },
                            details: {
                                type: 'object',
                            },
                        },
                    },
                },
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true,
                    },
                    message: {
                        type: 'string',
                        example: 'Operation successful',
                    },
                    data: {
                        type: 'object',
                    },
                    meta: {
                        type: 'object',
                    },
                },
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    page: {
                        type: 'integer',
                        example: 1,
                    },
                    limit: {
                        type: 'integer',
                        example: 10,
                    },
                    total: {
                        type: 'integer',
                        example: 100,
                    },
                    totalPages: {
                        type: 'integer',
                        example: 10,
                    },
                    hasNext: {
                        type: 'boolean',
                        example: true,
                    },
                    hasPrevious: {
                        type: 'boolean',
                        example: false,
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
        {
            name: 'Authentication',
            description: 'User authentication and authorization endpoints',
        },
        {
            name: 'RBAC',
            description: 'Role-Based Access Control management',
        },
        {
            name: 'Fleet Management',
            description: 'Bus, terminal, and driver management',
        },
        {
            name: 'Operations',
            description: 'Shifts, schedules, and assignments',
        },
        {
            name: 'Routes & Pricing',
            description: 'Route planning and fare management',
        },
        {
            name: 'Trips & Tracking',
            description: 'Trip lifecycle and real-time GPS tracking',
        },
        {
            name: 'Incidents',
            description: 'Incident reporting and management',
        },
        {
            name: 'Notifications',
            description: 'User notification system',
        },
        {
            name: 'AI & Analytics',
            description: 'Traffic predictions and reporting',
        },
    ],
};

export const swaggerOptions = {
    definition: swaggerDefinition,
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.types.ts'],
};

/**
 * Example usage in app.ts:
 * 
 * import swaggerJsdoc from 'swagger-jsdoc';
 * import swaggerUi from 'swagger-ui-express';
 * import { swaggerOptions } from '@/common/swagger';
 * 
 * const swaggerSpec = swaggerJsdoc(swaggerOptions);
 * app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 */
