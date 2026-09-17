import fs from 'fs';
let code = fs.readFileSync('src/pages/DealDetails.jsx', 'utf8');

// Insert Notes
code = code.replace(
  '<ActivityTimeline activities={deal.activities} />\n            </div>\n          </div>',
  `<ActivityTimeline activities={deal.activities} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              Notes
            </h2>
            <RelatedNotes entityType="deal" entityId={deal.id} currentUser={user} />
          </div>`
);

// Insert Tasks
code = code.replace(
  `          </div>\n        </div>\n      </div>\n    </div>`,
  `          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Tasks</h2>
            <RelatedTasks entityType="deal" entityId={deal.id} />
          </div>
        </div>
      </div>
    </div>`
);

fs.writeFileSync('src/pages/DealDetails.jsx', code);
