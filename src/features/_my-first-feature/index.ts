/**
 * MyFirstFeature Feature Configuration
 * @description CRUD routes + service + database + auth
 * @module @voilajsx/flux/features/my-first-feature
 * @file src/features/my-first-feature/index.ts
 */

import { createBackendContract } from '../../../contracts.js';
import type { FeatureConfig } from '../../../flux.js';

const myFirstFeatureFeature: FeatureConfig = {
  name: 'my-first-feature',
  
  contract: createBackendContract()
    .providesRoute('GET /my-first-feature')
    .providesRoute('POST /my-first-feature')
    .providesRoute('PUT /my-first-feature/:id')
    .providesRoute('DELETE /my-first-feature/:id')
    .providesService('my-first-featureService')
    .needsAuth()
    .needsLogging()
    .build(),

  routes: [
    {
      file: 'routes/index.ts',
      prefix: '/api/my-first-feature'
    }
  ],

  meta: {
    name: 'MyFirstFeature Service',
    description: 'CRUD routes + service + database + auth',
    version: '1.0.0',
    author: 'Flux Framework'
  }
};

export default myFirstFeatureFeature;