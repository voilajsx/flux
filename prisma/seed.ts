/**
 * Simple database seed for todo feature
 * @file prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing todos
  await prisma.todo.deleteMany();

  // Create 3 simple todos
  await prisma.todo.createMany({
    data: [
      { title: 'Learn Flux Framework', completed: false },
      { title: 'Build an API', completed: true },
      { title: 'Deploy to production', completed: false }
    ]
  });

  console.log('✅ Seeded 3 todos');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());