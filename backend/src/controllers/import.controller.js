import { parse } from 'csv-parse/sync';
import prisma from '../utils/prisma.js';
import { z } from 'zod';
import { calculateLeadScore } from '../services/scoring.service.js';



const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']).optional().default('NEW'),
  source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL', 'OTHER']).optional().default('OTHER'),
  assignedTo: z.string().uuid('Invalid assignedTo UUID').optional().or(z.literal(''))
});

export const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const csvData = req.file.buffer.toString('utf-8');
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const parsed = leadSchema.parse({
           firstName: row.firstName || row.first_name || '',
           lastName: row.lastName || row.last_name || '',
           email: row.email || undefined,
           phone: row.phone || undefined,
           company: row.company || undefined,
           status: row.status ? row.status.toUpperCase() : undefined,
           source: row.source ? row.source.toUpperCase() : undefined,
           assignedTo: row.assignedTo || undefined
        });

        let assignedTo = parsed.assignedTo;
        if (req.user.role === 'SALES_REP') {
           assignedTo = req.user.id;
        } else if (!assignedTo) {
           assignedTo = req.user.id;
        }

        const score = calculateLeadScore(parsed);

        if (parsed.email === '') delete parsed.email;
        if (parsed.phone === '') delete parsed.phone;
        if (parsed.company === '') delete parsed.company;
        if (parsed.assignedTo === '') delete parsed.assignedTo;

        await prisma.lead.create({
          data: {
            ...parsed,
            score,
            assignedTo,
          }
        });
        
        imported++;
      } catch (err) {
        failed++;
        errors.push({ row: i + 1, error: err.errors ? err.errors[0].message : err.message || 'Validation failed' });
      }
    }

    if (imported > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'LEAD',
          entityId: 'BULK_IMPORT',
          userId: req.user.id,
          newValue: `Bulk imported ${imported} leads`
        }
      });
    }

    res.json({ success: true, data: { imported, failed, errors, total: records.length } });
  } catch (error) {
    console.error('Import error:', error);
    res.status(400).json({ success: false, error: 'Failed to process CSV file. Ensure it is valid.' });
  }
};
