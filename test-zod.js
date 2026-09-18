import { z } from 'zod';

const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL', 'OTHER']).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  assignedTo: z.string().uuid().optional().nullable().or(z.literal('')),
  notes: z.string().optional(),
});

try {
  leadSchema.parse({
    firstName: "UI",
    lastName: "Test",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    source: "OTHER",
    status: "NEW",
    assignedTo: "",
    notes: ""
  });
  console.log("Validation passed");
} catch(e) {
  console.error("Validation failed", e.errors);
}
