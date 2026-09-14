import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.count();
  const leads = await prisma.lead.count();
  const deals = await prisma.deal.count();
  console.log(`DB Stats: Users=${users}, Leads=${leads}, Deals=${deals}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
