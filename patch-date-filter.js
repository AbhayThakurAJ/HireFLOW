import fs from 'fs';

let code = fs.readFileSync('backend/src/services/dashboard.service.js', 'utf8');
code = code.replace("function buildDateFilter(from, to) {\n  if (!from && !to) return undefined;\n  const dateFilter = {};\n  if (from) dateFilter.gte = new Date(from);\n  if (to) dateFilter.lte = new Date(to);\n  return dateFilter;\n}", "function buildDateFilter(from, to) {\n  if (!from && !to) return undefined;\n  const dateFilter = {};\n  if (from) {\n    const d = new Date(from);\n    if (isNaN(d.getTime())) throw new Error('Invalid from date');\n    dateFilter.gte = d;\n  }\n  if (to) {\n    const d = new Date(to);\n    if (isNaN(d.getTime())) throw new Error('Invalid to date');\n    dateFilter.lte = d;\n  }\n  return dateFilter;\n}");
fs.writeFileSync('backend/src/services/dashboard.service.js', code);

// And update the controller to catch the specific error
let ctrlCode = fs.readFileSync('backend/src/controllers/dashboard.controller.js', 'utf8');
ctrlCode = ctrlCode.replaceAll("console.error('Error fetching dashboard KPIs:', error);", "if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });\n    console.error('Error fetching dashboard KPIs:', error);");
ctrlCode = ctrlCode.replaceAll("console.error('Error fetching pipeline analytics:', error);", "if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });\n    console.error('Error fetching pipeline analytics:', error);");
ctrlCode = ctrlCode.replaceAll("console.error('Error fetching revenue analytics:', error);", "if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });\n    console.error('Error fetching revenue analytics:', error);");
ctrlCode = ctrlCode.replaceAll("console.error('Error fetching lead analytics:', error);", "if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });\n    console.error('Error fetching lead analytics:', error);");
ctrlCode = ctrlCode.replaceAll("console.error('Error fetching performance analytics:', error);", "if (error.message.includes('Invalid')) return res.status(400).json({ success: false, error: error.message });\n    console.error('Error fetching performance analytics:', error);");
fs.writeFileSync('backend/src/controllers/dashboard.controller.js', ctrlCode);

console.log('Patched date validation');
