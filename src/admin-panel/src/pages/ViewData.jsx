// import { useState, useEffect } from 'react';
// import { adminAPI } from '../services/api';
// import { Card, Button, Select, Alert } from '../components/common';
// import { format } from 'date-fns';

// const DataTypeSelector = ({ value, onChange }) => (
//   <Select
//     value={value}
//     onChange={(e) => onChange(e.target.value)}
//     options={[
//       { value: 'appointments', label: 'Appointments' },
//       { value: 'doctors', label: 'Doctors' },
//       { value: 'careProfiles', label: 'Care Profiles' },
//       { value: 'doctorSlots', label: 'Doctor Slots' },
//     ]}
//   />
// );

// export const ViewData = () => {
//   const [dataType, setDataType] = useState('appointments');
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   useEffect(() => {
//     fetchData();
//   }, [dataType]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       let response;
//       switch (dataType) {
//         case 'appointments':
//           response = await adminAPI.getAppointments();
//           break;
//         case 'doctors':
//           response = await adminAPI.getDoctors();
//           break;
//         case 'careProfiles':
//           response = await adminAPI.getCareProfiles();
//           break;
//         case 'doctorSlots':
//           response = await adminAPI.getDoctorSlots();
//           break;
//       }
//       const responseData = response.data.data || response.data;
//       setData(Array.isArray(responseData) ? responseData : responseData.data || []);
//     } catch (error) {
//       setMessage({
//         type: 'error',
//         text: error.response?.data?.message || 'Failed to load data',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateStatus = async (id) => {
//     const newStatus = prompt('Enter new status (PENDING, CONFIRMED, COMPLETED, CANCELLED):');
//     if (!newStatus) return;

//     try {
//       await adminAPI.updateAppointmentStatus(id, newStatus.toUpperCase());
//       setMessage({ type: 'success', text: 'Status updated successfully' });
//       fetchData();
//     } catch (error) {
//       setMessage({
//         type: 'error',
//         text: error.response?.data?.message || 'Failed to update status',
//       });
//     }
//   };

//   const renderAppointments = () => (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         <thead className="bg-gray-50 border-b">
//           <tr>
//             <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Patient</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Service</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Scheduled</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y">
//           {data.map((item) => (
//             <tr key={item.id} className="hover:bg-gray-50">
//               <td className="px-4 py-3 text-sm font-mono">{item.id.slice(0, 8)}...</td>
//               <td className="px-4 py-3 text-sm">{item.patient?.fullName || '-'}</td>
//               <td className="px-4 py-3 text-sm">{item.doctor?.fullName || '-'}</td>
//               <td className="px-4 py-3 text-sm">{item.service}</td>
//               <td className="px-4 py-3 text-sm">{format(new Date(item.scheduledAt), 'MMM dd, yyyy HH:mm')}</td>
//               <td className="px-4 py-3">
//                 <span className={`px-2 py-1 text-xs rounded-full ${
//                   item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
//                   item.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
//                   item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
//                   'bg-yellow-100 text-yellow-800'
//                 }`}>
//                   {item.status}
//                 </span>
//               </td>
//               <td className="px-4 py-3">
//                 <Button size="sm" onClick={() => handleUpdateStatus(item.id)}>
//                   Update Status
//                 </Button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const renderDoctors = () => (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         <thead className="bg-gray-50 border-b">
//           <tr>
//             <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Specialty</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Experience</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Clinic</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y">
//           {data.map((item) => (
//             <tr key={item.userId} className="hover:bg-gray-50">
//               <td className="px-4 py-3 text-sm font-mono">{item.userId.slice(0, 8)}...</td>
//               <td className="px-4 py-3 text-sm font-medium">{item.user?.fullName || '-'}</td>
//               <td className="px-4 py-3 text-sm">{item.user?.email || '-'}</td>
//               <td className="px-4 py-3 text-sm">{item.specialty}</td>
//               <td className="px-4 py-3 text-sm">{item.yearsExperience || '-'} years</td>
//               <td className="px-4 py-3 text-sm">{item.clinicName || '-'}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const renderCareProfiles = () => (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         <thead className="bg-gray-50 border-b">
//           <tr>
//             <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Relation</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Owner</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">DOB</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y">
//           {data.map((item) => (
//             <tr key={item.id} className="hover:bg-gray-50">
//               <td className="px-4 py-3 text-sm font-mono">{item.id.slice(0, 8)}...</td>
//               <td className="px-4 py-3 text-sm font-medium">{item.fullName}</td>
//               <td className="px-4 py-3 text-sm">{item.relation}</td>
//               <td className="px-4 py-3 text-sm">{item.owner?.fullName || '-'}</td>
//               <td className="px-4 py-3 text-sm">{item.dob ? format(new Date(item.dob), 'MMM dd, yyyy') : '-'}</td>
//               <td className="px-4 py-3 text-sm">{item.phone || '-'}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const renderDoctorSlots = () => (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         <thead className="bg-gray-50 border-b">
//           <tr>
//             <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Doctor</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Start</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">End</th>
//             <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y">
//           {data.map((item) => (
//             <tr key={item.id} className="hover:bg-gray-50">
//               <td className="px-4 py-3 text-sm font-mono">{item.id.slice(0, 8)}...</td>
//               <td className="px-4 py-3 text-sm">{item.doctor?.user?.fullName || '-'}</td>
//               <td className="px-4 py-3 text-sm">{format(new Date(item.start), 'MMM dd, yyyy HH:mm')}</td>
//               <td className="px-4 py-3 text-sm">{format(new Date(item.end), 'MMM dd, yyyy HH:mm')}</td>
//               <td className="px-4 py-3">
//                 <span className={`px-2 py-1 text-xs rounded-full ${
//                   item.isBooked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
//                 }`}>
//                   {item.isBooked ? 'Booked' : 'Available'}
//                 </span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-gray-900 mb-6">View All Data</h1>

//       {message.text && (
//         <div className="mb-4">
//           <Alert
//             type={message.type}
//             message={message.text}
//             onClose={() => setMessage({ type: '', text: '' })}
//           />
//         </div>
//       )}

//       <Card>
//         <div className="mb-6 flex justify-between items-center">
//           <div className="w-64">
//             <DataTypeSelector value={dataType} onChange={setDataType} />
//           </div>
//           <Button onClick={fetchData}>Refresh</Button>
//         </div>

//         {loading ? (
//           <div className="flex justify-center py-8">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           </div>
//         ) : (
//           <>
//             {dataType === 'appointments' && renderAppointments()}
//             {dataType === 'doctors' && renderDoctors()}
//             {dataType === 'careProfiles' && renderCareProfiles()}
//             {dataType === 'doctorSlots' && renderDoctorSlots()}

//             {data.length === 0 && (
//               <div className="text-center py-8 text-gray-500">
//                 No data found
//               </div>
//             )}
//           </>
//         )}
//       </Card>
//     </div>
//   );
// };
