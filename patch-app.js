import fs from 'fs';

let appCode = fs.readFileSync('backend/src/app.js', 'utf8');
appCode = appCode.replace("import noteRoutes from './routes/note.routes.js';", "import noteRoutes from './routes/note.routes.js';\nimport dashboardRoutes from './routes/dashboard.routes.js';");
appCode = appCode.replace("app.use('/api/notes', noteRoutes);", "app.use('/api/notes', noteRoutes);\napp.use('/api/dashboard', dashboardRoutes);");

fs.writeFileSync('backend/src/app.js', appCode);
console.log('App patched');
