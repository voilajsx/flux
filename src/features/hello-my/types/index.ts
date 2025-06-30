/**
 * HelloMy Feature - Type Definitions
 * @file src/features/hello-my/types/index.ts
 */

// Main entity interface
export interface HelloMyItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Request/Response types
export interface CreateHelloMyRequest {
  name: string;
  // Authentication handled automatically
}

export interface UpdateHelloMyRequest {
  name?: string;
}

export interface HelloMyResponse {
  success: boolean;
  data?: HelloMyItem | HelloMyItem[];
  error?: string;
  message?: string;
}

// Service interface
export interface HelloMyService {
  getAll(): Promise<HelloMyResponse>;
  getById(id: string): Promise<HelloMyResponse>;
  create(data: CreateHelloMyRequest, userId: string): Promise<HelloMyResponse>;
  update(id: string, data: UpdateHelloMyRequest): Promise<HelloMyResponse>;
  delete(id: string): Promise<HelloMyResponse>;
}