/**
 * Todo data models and types
 * @module @voilajsx/flux/features/todo
 * @file src/features/todo/models/todoModel.ts
 * 
 * @llm-rule WHEN: Defining minimal data structures for todo operations
 * @llm-rule AVOID: Complex fields like priority, tags, or description
 * @llm-rule NOTE: Models are internal to feature - not exported to other features
 */

import type { Todo as PrismaTodo } from '@prisma/client';

export type TodoModel = PrismaTodo;

export interface CreateTodoModel {
  readonly title: string;
}

export interface UpdateTodoModel {
  readonly title?: string;
  readonly completed?: boolean;
}

export interface TodoFilterModel {
  completed?: boolean;
}

export interface TodoStatsModel {
  readonly total: number;
  readonly completed: number;
  readonly pending: number;
}