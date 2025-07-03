# DogTorVet Frontend

A modern veterinary clinic management system built with React, TypeScript, and Tailwind CSS.

## Features

- **Client Management**: Register and manage pet owners
- **Pet Registration**: Complete pet profiles with medical history
- **Appointment Scheduling**: Book and manage veterinary appointments
- **Invoice Management**: Create and track invoices with payment status
- **Inventory Tracking**: Manage products and services
- **Species & Breeds**: Comprehensive pet categorization
- **Vaccination Records**: Track pet vaccinations and schedules
- **User Management**: Role-based access control for staff

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Icons**: FontAwesome

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see [DogTorVet API](https://github.com/yourusername/dogtorvet-api))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dogtorvet-ui.git
cd dogtorvet-ui
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional for local development):
```bash
# For local development with local API
VITE_API_BASE_URL=http://localhost:8000/api

# For production or if using the deployed API
VITE_API_BASE_URL=https://dogtorvet-api.onrender.com/api
```

4. Start the development server:
```bash
npm run dev
```

## Deployment on Render

This project is configured for easy deployment on Render as a static site.

### Automatic Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically detect the `render.yaml` configuration
4. The app will be built and deployed as a static site

### Manual Deployment

1. Create a new **Static Site** on Render
2. Connect your GitHub repository
3. Configure the build settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables if needed:
   - `VITE_API_BASE_URL`: Your API URL (defaults to production API)
5. Deploy!

### Environment Variables

The app uses the following environment variables:

- `VITE_API_BASE_URL`: The base URL for the backend API (optional, defaults to `https://dogtorvet-api.onrender.com/api`)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── api/          # API service modules
├── assets/       # Static assets (images, fonts)
├── components/   # Reusable React components
├── context/      # React Context providers
├── layouts/      # Page layouts
├── pages/        # Route page components
├── routes/       # Route configuration
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
