import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button, Alert } from '../components/common';
import { format } from 'date-fns';

export const ViewCareProfiles = () => {
  const [careProfiles, setCareProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCareProfiles();
  }, []);

  const fetchCareProfiles = async () => {
    try {
      setLoading(true);

      const response = await adminAPI.getCareProfiles();
      const data = response.data.data || response.data;

      const profileList = data.careProfiles || data;
      setCareProfiles(Array.isArray(profileList) ? profileList : []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load care profiles',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'ID copied to clipboard!' });

    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Care Profiles</h1>
        <Button onClick={fetchCareProfiles}>Refresh</Button>
      </div>

      {/* Message */}
      {message.text && (
        <div className="mb-4">
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        </div>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Relation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Owner</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">DOB</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {careProfiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">
                      <button
                        onClick={() => copyToClipboard(profile.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {profile.id.slice(0, 8)}...
                      </button>
                    </td>

                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {profile.fullName}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {profile.relation}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {profile.owner?.fullName || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {profile.dob ? format(new Date(profile.dob), 'MMM dd, yyyy') : '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {profile.gender || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {profile.phone || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <Button size="sm" variant="outline"
                        onClick={() => copyToClipboard(profile.id)}>
                        Copy ID
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {careProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No care profiles found. Create one first!
              </div>
            )}
          </div>
        )}
      </Card>

      {careProfiles.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Total Care Profiles:</strong> {careProfiles.length}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            <strong>Tip:</strong> Click on any ID to copy it to clipboard for creating appointments.
          </p>
        </div>
      )}
    </div>
  );
};
