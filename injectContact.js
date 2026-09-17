import fs from 'fs';
let code = fs.readFileSync('src/pages/ContactDetails.jsx', 'utf8');

if (!code.includes('RelatedNotes')) {
  code = `import ActivityTimeline from '../components/ActivityTimeline';
import RelatedNotes from '../components/RelatedNotes';
import { useAuth } from '../hooks/useAuth';\n` + code;
}

if (!code.includes('const { user } = useAuth();')) {
  code = code.replace(
    'const { data: contact, isLoading, error } = useContact(id);',
    'const { user } = useAuth();\n  const { data: contact, isLoading, error } = useContact(id);'
  );
}

// Add Activities and Notes below Deals.
code = code.replace(
  `            )}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  `            )}
          </div>
        </div>
        
        {/* Activity & Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activity History</h3>
          </div>
          <div className="px-6 py-6">
            <ActivityTimeline activities={contact.activities} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Notes</h3>
          </div>
          <div className="px-6 py-6">
            <RelatedNotes entityType="contact" entityId={contact.id} currentUser={user} />
          </div>
        </div>

      </div>
    </div>
  );
}`
);

fs.writeFileSync('src/pages/ContactDetails.jsx', code);
