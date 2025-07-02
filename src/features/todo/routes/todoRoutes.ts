/**
 * Todo REST API routes
 * @module @voilajsx/flux/features/todo  
 * @file src/features/todo/routes/todoRoutes.ts
 * 
 * @llm-rule WHEN: Need simple REST endpoints for todo operations
 * @llm-rule AVOID: Complex business logic in routes - delegate to services
 * @llm-rule NOTE: Routes handle HTTP concerns, services handle business logic
 */

import { router, type RequestType } from "@/flux";
import todoService from "../services/todoService";
import type { CreateTodoModel, UpdateTodoModel } from "../models/todoModel"; // 🔥 Add imports

export default router('todo', (routes) => {
  
  // GET /api/todos - Get all todos with optional completion filter
  routes.get('/todos', async (req: RequestType) => {
    try {
      const filters: any = {};
      
      if (req.query.completed === 'true') {
        filters.completed = true;
      } else if (req.query.completed === 'false') {
        filters.completed = false;
      }

      const todos = await todoService.getAll(filters);
      const stats = await todoService.getStats();

      return { 
        success: true,
        data: todos,
        meta: { total: todos.length, stats }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get todos'
      };
    }
  });

  // GET /api/todos/:id - Get specific todo
  routes.get('/todos/:id', async (req: RequestType) => {
    try {
      const todo = await todoService.getById(req.params.id);
      
      if (!todo) {
        return { success: false, error: 'Todo not found' };
      }

      return { success: true, data: todo };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get todo'
      };
    }
  });

  // POST /api/todos - Create new todo
  routes.post('/todos', async (req: RequestType) => {
    try {
      // 🔥 Fix: Properly type the request body
      const todo = await todoService.create(req.body as CreateTodoModel);
      return { 
        success: true,
        data: todo,
        message: 'Todo created successfully'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create todo'
      };
    }
  });

  // PUT /api/todos/:id - Update todo
  routes.put('/todos/:id', async (req: RequestType) => {
    try {
      // 🔥 Fix: Properly type the request body
      const todo = await todoService.update(req.params.id, req.body as UpdateTodoModel);
      
      if (!todo) {
        return { success: false, error: 'Todo not found' };
      }

      return { 
        success: true,
        data: todo,
        message: 'Todo updated successfully'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update todo'
      };
    }
  });

  // PATCH /api/todos/:id/toggle - Toggle completion
  routes.patch('/todos/:id/toggle', async (req: RequestType) => {
    try {
      const todo = await todoService.toggle(req.params.id);
      
      if (!todo) {
        return { success: false, error: 'Todo not found' };
      }

      return { 
        success: true,
        data: todo,
        message: `Todo ${todo.completed ? 'completed' : 'reopened'} successfully`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle todo'
      };
    }
  });

  // DELETE /api/todos/:id - Delete todo
  routes.delete('/todos/:id', async (req: RequestType) => {
    try {
      const deleted = await todoService.delete(req.params.id);
      
      if (!deleted) {
        return { success: false, error: 'Todo not found' };
      }

      return { 
        success: true,
        message: 'Todo deleted successfully'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete todo'
      };
    }
  });

});