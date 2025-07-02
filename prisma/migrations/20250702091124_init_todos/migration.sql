-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tenant_id" TEXT,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todos_tenant_id_idx" ON "todos"("tenant_id");

-- CreateIndex
CREATE INDEX "todos_completed_idx" ON "todos"("completed");

-- CreateIndex
CREATE INDEX "todos_priority_idx" ON "todos"("priority");

-- CreateIndex
CREATE INDEX "todos_created_at_idx" ON "todos"("created_at");
