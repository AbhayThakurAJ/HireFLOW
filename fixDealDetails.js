import fs from 'fs';
let code = fs.readFileSync('src/pages/DealDetails.jsx', 'utf8');

const regex = /<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">\s*<h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">\s*Notes\s*<\/h2>[\s\S]*?(?=<!-- Right Column|$)/i;

// Replace all notes and anything up to right column
const correctBottom = `
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            {deal.description ? (
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{deal.description}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">No description provided.</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              Activity History
            </h2>
            <div className="flow-root">
              <ActivityTimeline activities={deal.activities} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              Notes
            </h2>
            <RelatedNotes entityType="deal" entityId={deal.id} currentUser={user} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Details</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gray-500 flex items-center"><User className="h-4 w-4 mr-2"/> Owner</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {deal.assignee ? \`\${deal.assignee.firstName} \${deal.assignee.lastName}\` : 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="mt-1 text-gray-900">{format(new Date(deal.createdAt), 'MMM d, yyyy')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-gray-900">{format(new Date(deal.updatedAt), 'MMM d, yyyy')}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Tasks</h2>
            <RelatedTasks entityType="deal" entityId={deal.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const startIndex = code.indexOf('{/* Left Column */}');
code = code.substring(0, startIndex) + correctBottom;
fs.writeFileSync('src/pages/DealDetails.jsx', code);
