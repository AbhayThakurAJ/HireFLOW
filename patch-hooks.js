import fs from 'fs';

let code = fs.readFileSync('src/hooks/useTasks.js', 'utf8');

code = code.replace("queryClient.invalidateQueries({ queryKey: ['tasks'] });", "queryClient.invalidateQueries({ queryKey: ['tasks'] });\n      queryClient.invalidateQueries({ queryKey: ['deals'] });\n      queryClient.invalidateQueries({ queryKey: ['leads'] });\n      queryClient.invalidateQueries({ queryKey: ['activities'] });");

code = code.replace("queryClient.invalidateQueries({ queryKey: ['tasks'] });\n      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });", "queryClient.invalidateQueries({ queryKey: ['tasks'] });\n      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });\n      queryClient.invalidateQueries({ queryKey: ['deals'] });\n      queryClient.invalidateQueries({ queryKey: ['leads'] });\n      queryClient.invalidateQueries({ queryKey: ['activities'] });");

code = code.replace("queryClient.invalidateQueries({ queryKey: ['tasks'] });", "queryClient.invalidateQueries({ queryKey: ['tasks'] });\n      queryClient.invalidateQueries({ queryKey: ['deals'] });\n      queryClient.invalidateQueries({ queryKey: ['leads'] });\n      queryClient.invalidateQueries({ queryKey: ['activities'] });");

fs.writeFileSync('src/hooks/useTasks.js', code);

// Same for activities and notes
let aCode = fs.readFileSync('src/hooks/useActivities.js', 'utf8');
aCode = aCode.replace("queryClient.invalidateQueries({ queryKey: ['activities'] });", "queryClient.invalidateQueries({ queryKey: ['activities'] });\n      queryClient.invalidateQueries({ queryKey: ['deals'] });\n      queryClient.invalidateQueries({ queryKey: ['leads'] });\n      queryClient.invalidateQueries({ queryKey: ['companies'] });\n      queryClient.invalidateQueries({ queryKey: ['contacts'] });");
fs.writeFileSync('src/hooks/useActivities.js', aCode);

let nCode = fs.readFileSync('src/hooks/useNotes.js', 'utf8');
nCode = nCode.replaceAll("queryClient.invalidateQueries({ queryKey: ['notes'] });", "queryClient.invalidateQueries({ queryKey: ['notes'] });\n      queryClient.invalidateQueries({ queryKey: ['deals'] });\n      queryClient.invalidateQueries({ queryKey: ['leads'] });\n      queryClient.invalidateQueries({ queryKey: ['companies'] });\n      queryClient.invalidateQueries({ queryKey: ['contacts'] });");
fs.writeFileSync('src/hooks/useNotes.js', nCode);

console.log('Hooks patched');
