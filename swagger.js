// swagger.js
import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'pages/api', // location of your API handlers
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Next.js API Documentation',
        version: '1.0.0',
      },
    },
  });
  return spec;
};