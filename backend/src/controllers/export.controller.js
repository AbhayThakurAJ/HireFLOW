import { stringify } from 'csv-stringify/sync';
import prisma from '../utils/prisma.js';


const neutralizeFormula = (value) => {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
};

const sendCsv = (res, filename, data) => {
  if (data.length === 0) {
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send('');
  }
  
  const cast = {
    date: (value) => value.toISOString(),
    string: (value) => neutralizeFormula(value)
  };

  const csv = stringify(data, { header: true, cast });

  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  return res.send(csv);
};

export const exportLeads = async (req, res) => {
  try {
    const assignedFilter = req.user.role === 'SALES_REP' ? { assignedTo: req.user.id } : {};
    const leads = await prisma.lead.findMany({ where: assignedFilter });
    return sendCsv(res, 'leads.csv', leads);
  } catch (error) { res.status(500).send('Export failed'); }
};

export const exportContacts = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany();
    return sendCsv(res, 'contacts.csv', contacts);
  } catch (error) { res.status(500).send('Export failed'); }
};

export const exportCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    return sendCsv(res, 'companies.csv', companies);
  } catch (error) { res.status(500).send('Export failed'); }
};

export const exportDeals = async (req, res) => {
  try {
    const assignedFilter = req.user.role === 'SALES_REP' ? { assignedTo: req.user.id } : {};
    const deals = await prisma.deal.findMany({ where: assignedFilter });
    return sendCsv(res, 'deals.csv', deals);
  } catch (error) { res.status(500).send('Export failed'); }
};
