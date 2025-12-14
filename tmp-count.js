(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const count = await prisma.newsItem.count();
  console.log('newsItem count =', count);
  await prisma.$disconnect();
})();
