import fs from 'fs';
let code = fs.readFileSync('src/pages/LeadDetails.jsx', 'utf8');

if (!code.includes('RelatedTasks')) {
  code = `import ActivityTimeline from '../components/ActivityTimeline';
import RelatedTasks from '../components/RelatedTasks';
import RelatedNotes from '../components/RelatedNotes';
import { useAuth } from '../hooks/useAuth';\n` + code;
}

// Add user hook inside LeadDetails
if (!code.includes('const { user } = useAuth();')) {
  code = code.replace(
    'const { data: lead, isLoading, error } = useLead(id);',
    'const { user } = useAuth();\n  const { data: lead, isLoading, error } = useLead(id);'
  );
}

// Replace activity list
code = code.replace(
  /<div className="flow-root">[\s\S]*?<\/div>\n              \) : \(\n                <p className="text-sm text-gray-500 text-center py-4">No activity history recorded.<\/p>\n              \)}/,
  `<div className="flow-root">
                  <ActivityTimeline activities={lead.activities || []} />
                </div>`
);

// Add Notes block below Activity History
code = code.replace(
  `          </div>\n        </div>\n      </div>\n    </div>`,
  `          </div>
          
          <div className="bg-white shadow sm:rounded-lg mt-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                Notes
              </h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <RelatedNotes entityType="lead" entityId={lead.id} currentUser={user} />
            </div>
          </div>
        </div>
      </div>
    </div>`
);

// Add Tasks block below details (Left column or wherever suitable). 
// The layout has two columns, let's see. "mt-6" suggests a vertical stack.
// Wait, I should add Tasks to the left column (or below details).
// Let's just put it under the lead details block.
code = code.replace(
  `</dl>\n          </div>\n        </div>`,
  `</dl>
          </div>
          
          <div className="bg-white shadow sm:rounded-lg mt-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Tasks</h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <RelatedTasks entityType="lead" entityId={lead.id} />
            </div>
          </div>
        </div>`
);

fs.writeFileSync('src/pages/LeadDetails.jsx', code);
