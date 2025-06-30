/**
 * MyFirstFeature Feature - Type Definitions
 * @file src/features/my-first-feature/types/index.ts
 */

// Main entity interface
export interface MyFirstFeatureItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Request/Response types
export interface CreateMyFirstFeatureRequest {
  name: string;
  // Authentication handled automatically
}

export interface UpdateMyFirstFeatureRequest {
  name?: string;
}

export interface MyFirstFeatureResponse {
  success: boolean;
  data?: MyFirstFeatureItem | MyFirstFeatureItem[];
  error?: string;
  message?: string;
}

// Service interface
export interface MyFirstFeatureService {
  getAll(): Promise<MyFirstFeatureResponse>;
  getById(id: string): Promise<MyFirstFeatureResponse>;
  create(data: CreateMyFirstFeatureRequest, userId: string): Promise<MyFirstFeatureResponse>;
  update(id: string, data: UpdateMyFirstFeatureRequest): Promise<MyFirstFeatureResponse>;
  delete(id: string): Promise<MyFirstFeatureResponse>;
}