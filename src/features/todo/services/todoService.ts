/**
 * Todo service with basic CRUD operations
 * @module @voilajsx/flux/features/todo
 * @file src/features/todo/services/todoService.ts
 * 
 * @llm-rule WHEN: Other features need simple todo functionality
 * @llm-rule AVOID: Direct Prisma client access - use AppKit database wrapper
 * @llm-rule NOTE: Public service - can be imported by other features
 */

import { logger } from '@voilajsx/appkit/logging';
import { database } from '@voilajsx/appkit/database';
import type { 
  TodoModel, 
  CreateTodoModel, 
  UpdateTodoModel, 
  TodoFilterModel,
  TodoStatsModel
} from '../models/todoModel';
import todoValidator from '../validators/todoValidator';

const log = logger.get('todo-service');

const todoService = {
  // Get all todos with optional completion filter
  getAll: async (filters?: Partial<TodoFilterModel>): Promise<TodoModel[]> => {
    log.info('Getting all todos', { filters });
    
    const db = await database.get();
    
    const where: any = {};
    
    if (filters?.completed !== undefined) {
      where.completed = filters.completed;
    }

    const todos = await db.todo.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return todos;
  },

  // Get todo by ID
  getById: async (id: string): Promise<TodoModel | null> => {
    log.info('Getting todo by ID', { id });
    
    const validation = todoValidator.validateId(id);
    if (!validation.valid) {
      throw new Error(`Invalid ID: ${validation.errors.join(', ')}`);
    }

    const db = await database.get();
    const todo = await db.todo.findUnique({
      where: { id: validation.data }
    });

    if (!todo) {
      log.warn('Todo not found', { id });
      return null;
    }

    return todo;
  },

  // Create new todo
  create: async (data: CreateTodoModel): Promise<TodoModel> => {
    log.info('Creating new todo', { data });

    const validation = todoValidator.validateCreate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const db = await database.get();
    
    const newTodo = await db.todo.create({
      data: {
        title: validation.data.title,
        completed: false
      }
    });

    log.info('Todo created successfully', { id: newTodo.id, title: newTodo.title });
    return newTodo;
  },

  // Update existing todo
  update: async (id: string, data: UpdateTodoModel): Promise<TodoModel | null> => {
    log.info('Updating todo', { id, data });

    const idValidation = todoValidator.validateId(id);
    if (!idValidation.valid) {
      throw new Error(`Invalid ID: ${idValidation.errors.join(', ')}`);
    }

    const validation = todoValidator.validateUpdate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const db = await database.get();

    try {
      const updatedTodo = await db.todo.update({
        where: { id: idValidation.data },
        data: validation.data
      });

      log.info('Todo updated successfully', { id, title: updatedTodo.title });
      return updatedTodo;
    } catch (error: any) {
      if (error.code === 'P2025') {
        log.warn('Todo not found for update', { id });
        return null;
      }
      throw error;
    }
  },

  // Toggle completion status
  toggle: async (id: string): Promise<TodoModel | null> => {
    log.info('Toggling todo completion', { id });

    const validation = todoValidator.validateId(id);
    if (!validation.valid) {
      throw new Error(`Invalid ID: ${validation.errors.join(', ')}`);
    }

    const db = await database.get();

    try {
      const currentTodo = await db.todo.findUnique({
        where: { id: validation.data }
      });

      if (!currentTodo) {
        return null;
      }

      const updatedTodo = await db.todo.update({
        where: { id: validation.data },
        data: { completed: !currentTodo.completed }
      });

      log.info('Todo completion toggled', { id, completed: updatedTodo.completed });
      return updatedTodo;
    } catch (error: any) {
      if (error.code === 'P2025') {
        log.warn('Todo not found for toggle', { id });
        return null;
      }
      throw error;
    }
  },

  // Delete todo
  delete: async (id: string): Promise<boolean> => {
    log.info('Deleting todo', { id });

    const validation = todoValidator.validateId(id);
    if (!validation.valid) {
      throw new Error(`Invalid ID: ${validation.errors.join(', ')}`);
    }

    const db = await database.get();

    try {
      await db.todo.delete({
        where: { id: validation.data }
      });

      log.info('Todo deleted successfully', { id });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        log.warn('Todo not found for deletion', { id });
        return false;
      }
      throw error;
    }
  },

  // Get statistics
  getStats: async (): Promise<TodoStatsModel> => {
    log.info('Getting todo statistics');

    const db = await database.get();

    const [total, completed] = await Promise.all([
      db.todo.count(),
      db.todo.count({ where: { completed: true } })
    ]);

    const stats: TodoStatsModel = {
      total,
      completed,
      pending: total - completed
    };

    return stats;
  }
};

export default todoService;