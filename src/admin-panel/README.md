# Admin Panel - React Application

Modern React-based admin panel for managing the medical appointment system.

## Features

### Dashboard
- Real-time statistics display
- Total users, doctors, patients
- Appointment statistics
- Care profiles count

### User Management
- Create new users (Patient, Doctor, Admin)
- Search and filter users
- Delete users
- View user details

### Doctor Management
- Add new doctors with profiles
- Specialty and experience tracking
- Clinic information

### Care Profiles
- Create patient care profiles
- Comprehensive patient information
- Insurance details
- Address and contact management

### Appointments
- Create appointments
- Link to care profiles and doctor slots
- Update appointment status
- View all appointments

### Doctor Slots
- Create available time slots
- View slot availability
- Track booked slots

## Tech Stack

- **React 19** - UI Framework
- **React Router v7** - Routing
- **TailwindCSS** - Styling
- **Axios** - API calls
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Vite** - Build tool

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:4000/api
```

## Usage

1. Start the backend server first (on port 4000)
2. Run the admin panel: `npm run dev`
3. Open browser to `http://localhost:5173`
4. Login with admin credentials

## Admin Access

Only users with `ADMIN` role can access the panel. Login requires:
- Email
- Password
- Admin role

## Project Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── common/       # Reusable components
│   │   └── layout/       # Layout components
│   ├── contexts/         # React contexts
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── public/               # Static assets
└── .env                  # Environment variables
```

## API Endpoints Used

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/admin/statistics` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/doctors` - List doctors
- `POST /api/admin/doctors` - Create doctor
- `GET /api/admin/care-profiles` - List care profiles
- `POST /api/admin/care-profiles` - Create care profile
- `GET /api/admin/doctor-slots` - List doctor slots
- `POST /api/admin/doctor-slots` - Create doctor slot
- `GET /api/admin/appointments` - List appointments
- `POST /api/admin/appointments` - Create appointment
- `PATCH /api/admin/appointments/:id/status` - Update status

## Features

### Authentication
- JWT-based authentication
- Protected routes
- Auto logout on token expiration
- Role-based access control

### UI/UX
- Responsive design
- Modern, clean interface
- Loading states
- Error handling
- Success/error notifications
- Form validation

### Data Management
- Search and filtering
- Sortable tables
- Pagination support
- Real-time updates
- Status management

## Development

```bash
# Run in development mode
npm run dev

# The app will be available at http://localhost:5173
```

## Build

```bash
# Build for production
npm run build

# Output will be in the `dist` folder
```

## Security

- All API requests require authentication
- Token stored in localStorage
- Automatic token validation
- Role-based access control
- CORS enabled on backend

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- Make sure backend is running on port 4000
- Backend must have CORS enabled
- Admin user must exist in database
- Default API URL is localhost:4000
