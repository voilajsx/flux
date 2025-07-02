/**
 * Todo feature configuration
 * @module @voilajsx/flux/features/todo
 * @file src/features/todo/index.ts
 * 
 * @llm-rule WHEN: Need minimal CRUD operations with database storage
 * @llm-rule AVOID: External database access - uses AppKit database wrapper
 * @llm-rule NOTE: Ultra-minimal demo feature for CLI scaffolding template
 */

import type { FeatureConfig } from "@/flux";
import { createBackendContract } from "@/contracts";

const todoFeature: FeatureConfig = {
  name: "todo",

  contract: createBackendContract()
    .provides('routes', [
      'GET /todos',
      'POST /todos', 
      'GET /todos/:id',
      'PUT /todos/:id',
      'DELETE /todos/:id',
      'PATCH /todos/:id/toggle'
    ])
    .provides('services', ['todoService'])
    .internal('validators', ['todoValidator'])
    .internal('models', [
      'TodoModel', 
      'CreateTodoModel',
      'UpdateTodoModel',      
      'TodoFilterModel',       
      'TodoStatsModel'       
    ])
    .import('appkit', ['logging', 'database'])
    .build(),

  routes: [
    {
      file: "routes/todoRoutes.ts",
      prefix: "/api",
    },
  ],

  meta: {
    name: "Todo API",
    description: "Ultra-minimal CRUD operations for CLI scaffolding template",
    version: "1.0.0",
    author: "Flux Framework CLI Template",
  },
};

export default todoFeature;