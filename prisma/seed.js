import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SEED SCRIPT ABORTED: Do not run seed in production!');
    process.exit(1);
  }

  console.log('Starting seed...');

  // Clean DB
  console.log('Cleaning database...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // Users (5)
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@hireflow.com',
        firstName: 'Alice',
        lastName: 'Admin',
        password: defaultPassword,
        role: 'ADMIN',
      }
    }),
    prisma.user.create({
      data: {
        email: 'manager@hireflow.com',
        firstName: 'Mark',
        lastName: 'Manager',
        password: defaultPassword,
        role: 'MANAGER',
      }
    }),
    prisma.user.create({
      data: {
        email: 'sales1@hireflow.com',
        firstName: 'Sarah',
        lastName: 'Sales',
        password: defaultPassword,
        role: 'SALES_REP',
      }
    }),
    prisma.user.create({
      data: {
        email: 'sales2@hireflow.com',
        firstName: 'Sam',
        lastName: 'Sales',
        password: defaultPassword,
        role: 'SALES_REP',
      }
    }),
    prisma.user.create({
      data: {
        email: 'sales3@hireflow.com',
        firstName: 'Steve',
        lastName: 'Sales',
        password: defaultPassword,
        role: 'SALES_REP',
      }
    }),
  ]);

  const salesReps = users.filter(u => u.role === 'SALES_REP');

  // Companies (30)
  console.log('Creating companies...');
  const companies = [];
  for (let i = 0; i < 30; i++) {
    companies.push(await prisma.company.create({
      data: {
        name: faker.company.name(),
        industry: faker.company.buzzNoun(),
        website: faker.internet.url(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
        location: faker.location.city() + ', ' + faker.location.country(),
        description: faker.company.catchPhrase(),
      }
    }));
  }

  // Contacts (50)
  console.log('Creating contacts...');
  const contacts = [];
  for (let i = 0; i < 50; i++) {
    contacts.push(await prisma.contact.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        jobTitle: faker.person.jobTitle(),
        status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'INACTIVE']),
        companyId: faker.helpers.arrayElement(companies).id,
      }
    }));
  }

  // Leads (100)
  console.log('Creating leads...');
  const leads = [];
  const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];
  const leadSources = ['WEBSITE', 'LINKEDIN', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL', 'OTHER'];
  for (let i = 0; i < 100; i++) {
    leads.push(await prisma.lead.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        company: faker.company.name(),
        jobTitle: faker.person.jobTitle(),
        source: faker.helpers.arrayElement(leadSources),
        status: faker.helpers.arrayElement(leadStatuses),
        score: faker.number.int({ min: 10, max: 100 }),
        assignedTo: faker.helpers.arrayElement(salesReps).id,
        companyId: faker.helpers.maybe(() => faker.helpers.arrayElement(companies).id, { probability: 0.3 }),
      }
    }));
  }

  // Deals (40)
  console.log('Creating deals...');
  const deals = [];
  const dealStages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  for (let i = 0; i < 40; i++) {
    deals.push(await prisma.deal.create({
      data: {
        title: faker.company.catchPhrase() + ' Deal',
        value: faker.number.int({ min: 1000, max: 100000 }),
        currency: 'USD',
        stage: faker.helpers.arrayElement(dealStages),
        probability: faker.number.int({ min: 10, max: 100 }),
        expectedCloseDate: faker.date.future(),
        companyId: faker.helpers.arrayElement(companies).id,
        contactId: faker.helpers.arrayElement(contacts).id,
        assignedTo: faker.helpers.arrayElement(salesReps).id,
      }
    }));
  }

  // Tasks (50)
  console.log('Creating tasks...');
  for (let i = 0; i < 50; i++) {
    const isDealTask = faker.datatype.boolean();
    await prisma.task.create({
      data: {
        title: faker.hacker.verb() + ' ' + faker.hacker.noun(),
        description: faker.lorem.sentence(),
        dueDate: faker.date.soon({ days: 14 }),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
        status: faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'COMPLETED']),
        assignedTo: faker.helpers.arrayElement(salesReps).id,
        dealId: isDealTask ? faker.helpers.arrayElement(deals).id : null,
        leadId: !isDealTask ? faker.helpers.arrayElement(leads).id : null,
      }
    });
  }

  // Activities (100)
  console.log('Creating activities...');
  const activityTypes = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'STATUS_CHANGE'];
  for (let i = 0; i < 100; i++) {
    const isDealActivity = faker.datatype.boolean();
    await prisma.activity.create({
      data: {
        type: faker.helpers.arrayElement(activityTypes),
        content: faker.lorem.sentence(),
        userId: faker.helpers.arrayElement(salesReps).id,
        dealId: isDealActivity ? faker.helpers.arrayElement(deals).id : null,
        leadId: !isDealActivity ? faker.helpers.arrayElement(leads).id : null,
        createdAt: faker.date.recent({ days: 30 }),
      }
    });
  }

  // Notifications (50)
  console.log('Creating notifications...');
  for (let i = 0; i < 50; i++) {
    await prisma.notification.create({
      data: {
        title: 'System Update',
        message: faker.lorem.sentence(),
        userId: faker.helpers.arrayElement(users).id,
        read: faker.datatype.boolean(),
        createdAt: faker.date.recent({ days: 7 }),
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
