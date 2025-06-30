/**
 * Greeting Feature Configuration
 * @description Demo feature showing Flux contract system and API routes with TypeScript
 * @module @voilajsx/flux/features/greeting
 * @file src/features/greeting/index.ts
 */

import type { FeatureConfig } from '../../../flux';

import { createBackendContract } from '../../../contracts';
const greetingFeature: FeatureConfig = {
  name: 'greeting',
  
  contract: createBackendContract()
    .providesRoute('GET /hello')
    .providesRoute('POST /greet/:name')
    .providesRoute('GET /personal')
    .providesRoute('GET /admin')
    .providesService('greetingService')
    .needsAuth()
    .needsLogging()
    .build(),

  routes: [
    {
      file: 'routes/greetingRoutes.ts',
      prefix: '/api/greeting'
    }
  ],

  meta: {
    name: 'Greeting Service',
    description: 'Demo feature with public, authenticated, and admin endpoints',
    version: '1.0.0',
    author: 'Flux Framework'
  }
};

export default greetingFeature;