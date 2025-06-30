/**
 * HelloMy Feature Configuration
 * @description CRUD routes + service + database + auth
 * @module @voilajsx/flux/features/hello-my
 * @file src/features/hello-my/index.ts
 */

import { createBackendContract } from '../../../contracts.js';
import type { FeatureConfig } from '../../../flux.js';

const helloMyFeature: FeatureConfig = {
  name: 'hello-my',
  
  contract: createBackendContract()
    .providesRoute('GET /hello-my')
    .providesRoute('POST /hello-my')
    .providesRoute('PUT /hello-my/:id')
    .providesRoute('DELETE /hello-my/:id')
    .providesService('hello-myService')
    .needsAuth()
    .needsLogging()
    .build(),

  routes: [
    {
      file: 'routes/index.ts',
      prefix: '/api/hello-my'
    }
  ],

  meta: {
    name: 'HelloMy Service',
    description: 'CRUD routes + service + database + auth',
    version: '1.0.0',
    author: 'Flux Framework'
  }
};

export default helloMyFeature;