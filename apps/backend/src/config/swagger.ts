import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bus Management System API",
      version: "1.0.0",
      description: "API documentation for Bus Management System",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
  },

  apis: [
    "./src/**/*.controller.ts",
    "./src/**/*.routes.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi };