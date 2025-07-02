/**
 * Todo validation using Zod
 * @module @voilajsx/flux/features/todo
 * @file src/features/todo/validators/todoValidator.ts
 * 
 * @llm-rule WHEN: Need minimal input validation for todo operations
 * @llm-rule AVOID: Complex validation rules - keep it simple with just title validation
 * @llm-rule NOTE: Internal validator - not exported to other features
 */

import { z } from 'zod';

const CreateTodoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .transform(val => val.trim())
});

const UpdateTodoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .transform(val => val.trim())
    .optional(),
  completed: z.boolean().optional()
});

const IdSchema = z.string()
  .min(1, 'ID is required')
  .transform(val => val.trim());

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

const todoValidator = {
  validateCreate: (data: unknown): ValidationResult => {
    try {
      const parsed = CreateTodoSchema.parse(data);
      return { valid: true, errors: [], data: parsed };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: error.errors.map(err => err.message) };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  },

  validateUpdate: (data: unknown): ValidationResult => {
    try {
      const parsed = UpdateTodoSchema.parse(data);
      return { valid: true, errors: [], data: parsed };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: error.errors.map(err => err.message) };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  },

  validateId: (id: unknown): ValidationResult => {
    try {
      const parsed = IdSchema.parse(id);
      return { valid: true, errors: [], data: parsed };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, errors: error.errors.map(err => err.message) };
      }
      return { valid: false, errors: ['ID validation failed'] };
    }
  }
};

export default todoValidator;