/**
 * Hello feature configuration
 * @module @voilajsx/flux/features/hello
 * @file src/features/hello/index.ts
 */

import type { FeatureConfig } from "@/flux";
import { createBackendContract } from "@/contracts";

const helloFeature: FeatureConfig = {
  name: "hello",

  contract: createBackendContract()
    .provides('routes', ['GET /hello', 'GET /hi', 'GET /hello/:name'])
    .provides('services', ['helloService'])
    .build(),

  routes: [
    {
      file: "routes/helloRoutes.ts",
      prefix: "/api",
    },
  ],

  meta: {
    name: "Multi-language Hello Service",
    description: "Simple greeting feature supporting multiple languages",
    version: "1.0.0",
    author: "Flux Framework",
  },
};

export default helloFeature;