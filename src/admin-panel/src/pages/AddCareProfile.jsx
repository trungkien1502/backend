import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button, Input, Select, Alert } from '../components/common';

export const AddCareProfile = () => {
  const [formData, setFormData] = useState({
    ownerId: '',
    fullName: '',
    relation: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    nationalId: '',
    occupation: '',
    province: '',
    district: '',
    address: '',
    insuranceNo: '',
    note: '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      const data = response.data.data || response.data;
      // Backend returns { data: { users: [], pagination: {} } }
      const usersList = data.users || data;
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        ...formData,
        dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
      };
      await adminAPI.createCareProfile(data);
      setMessage({ type: 'success', text: 'Care Profile created successfully!' });
      setFormData({
        ownerId: '',
        fullName: '',
        relation: '',
        dob: '',
        gender: '',
        phone: '',
        email: '',
        nationalId: '',
        occupation: '',
        province: '',
        district: '',
        address: '',
        insuranceNo: '',
        note: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create care profile',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Care Profile</h1>

      {message.text && (
        <div className="mb-4">
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Owner User"
            required
            value={formData.ownerId}
            onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
            options={[
              { value: '', label: 'Select Owner User...' },
              ...users.map(user => ({
                value: user.id,
                label: `${user.fullName} (${user.email}) - ${user.role}`
              }))
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Input
              label="Relation"
              required
              value={formData.relation}
              onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
              placeholder="e.g., Self, Parent, Child"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={[
                { value: '', label: 'Select...' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="National ID (CCCD)"
              value={formData.nationalId}
              onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
            />
          </div>

          <Input
            label="Occupation"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Province"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            />
            <Input
              label="District"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            label="Insurance Number"
            value={formData.insuranceNo}
            onChange={(e) => setFormData({ ...formData, insuranceNo: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Create Care Profile
          </Button>
        </form>
      </Card>
    </div>
  );
};
