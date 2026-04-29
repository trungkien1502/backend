import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Button, Input, Alert, Select } from '../components/common';

export const AddAppointment = () => {
  const [formData, setFormData] = useState({
    careProfileId: '',
    slotId: '',
    service: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [careProfiles, setCareProfiles] = useState([]);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    setLoadingData(true);
    const [profilesRes, slotsRes] = await Promise.all([
      adminAPI.getCareProfiles(),
      adminAPI.getDoctorSlots(),
    ]);

    const profilesData = profilesRes.data.data || profilesRes.data;
    const slotsData = slotsRes.data.data || slotsRes.data;

    const profilesList = profilesData.careProfiles || profilesData;
    setCareProfiles(Array.isArray(profilesList) ? profilesList : []);

    const slotsList = slotsData.slots || slotsData;

    const now = new Date();

    const availableSlots = Array.isArray(slotsList)
      ? slotsList.filter(slot => {
          // slot chưa được đặt
          if (slot.isBooked) return false;

          // slot ở tương lai
          const slotStart = new Date(slot.start);
          return slotStart > now;
        })
      : [];

    setDoctorSlots(availableSlots);
  } catch (error) {
    console.error('Failed to load data:', error);
    setMessage({
      type: 'error',
      text: 'Failed to load care profiles and doctor slots',
    });
  } finally {
    setLoadingData(false);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await adminAPI.createAppointment(formData);
      setMessage({ type: 'success', text: 'Appointment created successfully!' });
      setFormData({
        careProfileId: '',
        slotId: '',
        service: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create appointment',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Appointment</h1>

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
        {loadingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Care Profile"
              required
              value={formData.careProfileId}
              onChange={(e) => setFormData({ ...formData, careProfileId: e.target.value })}
              options={[
                { value: '', label: 'Select Care Profile...' },
                ...careProfiles.map(profile => ({
                  value: profile.id,
                  label: `${profile.fullName} (${profile.relation}) - ${profile.owner?.fullName || profile.ownerId}`
                }))
              ]}
            />

            <Select
              label="Doctor Slot"
              required
              value={formData.slotId}
              onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
              options={[
                { value: '', label: 'Select Doctor Slot...' },
                ...doctorSlots.map(slot => ({
                  value: slot.id,
                  label: `${slot.doctor?.user?.fullName || 'Doctor'} - ${new Date(slot.start).toLocaleString()} to ${new Date(slot.end).toLocaleTimeString()}`
                }))
              ]}
            />

            <Input
              label="Service"
              required
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              placeholder="e.g., General Checkup, Consultation"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Available:</strong> {careProfiles.length} care profiles, {doctorSlots.length} doctor slots
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Create Appointment
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
