import { PrismaClient } from '@prisma/client';

const baseUrl = 'http://localhost:3000/api';
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING PHASE 5 REVIEW TESTS ---');
  let res, data, adminCookie, salesCookie;
  
  // 1. Get auth cookies
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hireflow.com', password: 'Password123!' })
  });
  adminCookie = res.headers.get('set-cookie').split(';')[0];
  const adminId = (await res.json()).data.id;
  
  res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales1@hireflow.com', password: 'Password123!' })
  });
  salesCookie = res.headers.get('set-cookie').split(';')[0];
  const salesId = (await res.json()).data.id;

  // Unauthenticated request
  res = await fetch(`${baseUrl}/companies`);
  if (res.status !== 401) throw new Error('Unauthenticated access should be blocked. Got ' + res.status);
  console.log('✅ Unauthenticated request correctly blocked (401)');

  // Admin Company Access
  res = await fetch(`${baseUrl}/companies`, { headers: { 'Cookie': adminCookie } });
  data = await res.json();
  if (!data.success) throw new Error('Admin could not fetch companies correctly');
  console.log(`✅ Admin company access OK (found ${data.meta.total} companies)`);

  // Invalid Company Creation
  res = await fetch(`${baseUrl}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: '' }) // Invalid
  });
  if (res.status !== 400) throw new Error('Invalid company creation should return 400. Got ' + res.status);
  console.log('✅ Invalid company creation correctly rejected by Zod (400)');

  // Valid Company Creation
  res = await fetch(`${baseUrl}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: 'Test Corp Phase 5', industry: 'Software', email: 'hello@testcorp.com' })
  });
  data = await res.json();
  if (data.status === 400) throw new Error('Valid company creation failed: ' + JSON.stringify(data));
  const companyId = data.data.id;
  console.log(`✅ Valid company created with ID ${companyId}`);

  // Audit Log for Company Creation
  let audit = await prisma.auditLog.findFirst({ where: { entityId: companyId, action: 'CREATE' } });
  if (!audit) throw new Error('Company creation did not generate AuditLog');
  console.log('✅ AuditLog record correctly created for company creation');

  // Valid Contact Creation linked to Company
  res = await fetch(`${baseUrl}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ firstName: 'Jane', lastName: 'Doe', companyId: companyId, email: 'jane@testcorp.com' })
  });
  data = await res.json();
  if (!data.success) throw new Error('Valid contact creation failed: ' + JSON.stringify(data));
  const contactId = data.data.id;
  console.log(`✅ Valid contact created with ID ${contactId} linked to company ${companyId}`);

  // Audit Log for Contact Creation
  audit = await prisma.auditLog.findFirst({ where: { entityId: contactId, action: 'CREATE' } });
  if (!audit) throw new Error('Contact creation did not generate AuditLog');
  console.log('✅ AuditLog record correctly created for contact creation');

  // Company Details (Should load Contacts)
  res = await fetch(`${baseUrl}/companies/${companyId}`, { headers: { 'Cookie': adminCookie } });
  data = await res.json();
  if (!data.success || !data.data.contacts || data.data.contacts.length !== 1) {
    throw new Error('Company details failed to load associated contacts');
  }
  console.log('✅ Company details correctly loaded associated Contact');

  // Contact Details (Should load Company)
  res = await fetch(`${baseUrl}/contacts/${contactId}`, { headers: { 'Cookie': adminCookie } });
  data = await res.json();
  if (!data.success || !data.data.company || data.data.company.id !== companyId) {
    throw new Error('Contact details failed to load associated company');
  }
  console.log('✅ Contact details correctly loaded associated Company');

  // Search Companies
  res = await fetch(`${baseUrl}/companies?search=Test%20Corp`, { headers: { 'Cookie': adminCookie } });
  data = await res.json();
  if (data.meta.total < 1) throw new Error('Search failed to find created company');
  console.log(`✅ Search correctly returned ${data.meta.total} results`);

  // Pagination Companies
  res = await fetch(`${baseUrl}/companies?page=1&limit=1`, { headers: { 'Cookie': adminCookie } });
  data = await res.json();
  if (data.meta.page !== 1 || data.meta.limit !== 1 || data.data.length > 1) throw new Error('Pagination metadata or response is incorrect');
  console.log('✅ Server-side pagination is functioning correctly');

  // Update Company
  res = await fetch(`${baseUrl}/companies/${companyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ industry: 'Hardware' })
  });
  data = await res.json();
  if (!data.success || data.data.industry !== 'Hardware') throw new Error('Company update failed');
  console.log('✅ Company updated successfully');

  // Sales Rep Delete Attempt (Company)
  res = await fetch(`${baseUrl}/companies/${companyId}`, { method: 'DELETE', headers: { 'Cookie': salesCookie } });
  if (res.status !== 403) throw new Error('Sales rep should be blocked from deleting company. Got ' + res.status);
  console.log('✅ Sales rep correctly blocked from deleting company (403)');

  // Sales Rep Delete Attempt (Contact)
  res = await fetch(`${baseUrl}/contacts/${contactId}`, { method: 'DELETE', headers: { 'Cookie': salesCookie } });
  if (res.status !== 403) throw new Error('Sales rep should be blocked from deleting contact. Got ' + res.status);
  console.log('✅ Sales rep correctly blocked from deleting contact (403)');

  // Admin Delete Contact
  res = await fetch(`${baseUrl}/contacts/${contactId}`, { method: 'DELETE', headers: { 'Cookie': adminCookie } });
  if (res.status !== 200) throw new Error('Admin should be able to delete contact. Got ' + res.status);
  console.log('✅ Admin correctly deleted contact (200)');

  // Admin Delete Company
  res = await fetch(`${baseUrl}/companies/${companyId}`, { method: 'DELETE', headers: { 'Cookie': adminCookie } });
  if (res.status !== 200) throw new Error('Admin should be able to delete company. Got ' + res.status);
  console.log('✅ Admin correctly deleted company (200)');

  // 404 Lookups
  res = await fetch(`${baseUrl}/companies/00000000-0000-0000-0000-000000000000`, { headers: { 'Cookie': adminCookie } });
  if (res.status !== 404) throw new Error('Nonexistent company should return 404. Got ' + res.status);
  
  res = await fetch(`${baseUrl}/contacts/00000000-0000-0000-0000-000000000000`, { headers: { 'Cookie': adminCookie } });
  if (res.status !== 404) throw new Error('Nonexistent contact should return 404. Got ' + res.status);
  console.log('✅ 404 Lookups correctly handled');

  console.log('\n🎉 ALL PHASE 5 REVIEW TESTS PASSED!');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
