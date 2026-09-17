import fs from 'fs';

let noteCode = fs.readFileSync('backend/src/controllers/note.controller.js', 'utf8');

const authCheck = `
    if (req.user.role === 'SALES_REP') {
      if (validatedData.leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: validatedData.leadId } });
        if (!lead || lead.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized lead' });
      }
      if (validatedData.dealId) {
        const deal = await prisma.deal.findUnique({ where: { id: validatedData.dealId } });
        if (!deal || deal.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized deal' });
      }
    }
`;

noteCode = noteCode.replace("if (validatedData.contactId === '') validatedData.contactId = null;", "if (validatedData.contactId === '') validatedData.contactId = null;\n" + authCheck);
fs.writeFileSync('backend/src/controllers/note.controller.js', noteCode);

let actCode = fs.readFileSync('backend/src/controllers/activity.controller.js', 'utf8');
actCode = actCode.replace("if (validatedData.contactId === '') validatedData.contactId = null;", "if (validatedData.contactId === '') validatedData.contactId = null;\n" + authCheck);
fs.writeFileSync('backend/src/controllers/activity.controller.js', actCode);

console.log('Patched');
