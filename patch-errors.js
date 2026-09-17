import fs from 'fs';

['backend/src/controllers/note.controller.js', 'backend/src/controllers/activity.controller.js'].forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace("if (error && error.name === 'ZodError')", "if (error && error.code === 'P2003') {\n      return res.status(400).json({ success: false, error: 'Invalid reference to a nonexistent entity' });\n    }\n    if (error && error.name === 'ZodError')");
    fs.writeFileSync(file, code);
});
console.log('Patched errors');
