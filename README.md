# DogTorVet Services - Frontend

A modern veterinary management system built with React, TypeScript, and Tailwind CSS.

## 🚀 Production Deployment

The application is deployed on Render at: **https://dogtorvetservices.onrender.com**

### Environment Configuration

The frontend automatically uses the production API URL when deployed on Render:
- **Production API**: https://dogtorvet-api.onrender.com/api/v1
- **Development API**: http://localhost:8000/api/v1

### Build Process

The production build automatically:
- Removes all `console.log` statements
- Minifies and optimizes the code
- Generates optimized static files

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable UI components
├── context/       # React context providers
├── layouts/       # Layout components
├── pages/         # Page components
├── routes/        # Routing configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## 🎨 Features

- **Modern UI**: Built with Tailwind CSS and Radix UI
- **Responsive Design**: Mobile-first approach
- **Type Safety**: Full TypeScript support
- **Authentication**: JWT-based auth with refresh tokens
- **Real-time Updates**: Optimistic UI updates
- **Print Support**: PDF generation for invoices
- **Data Management**: CRUD operations for all entities

## 🔧 Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **Axios** - HTTP client
- **React Router** - Navigation
- **Vite** - Build tool

## 📱 Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security

- HTTPS enforced in production
- CORS properly configured
- JWT token authentication
- Secure headers configured
- XSS protection enabled

## 📊 Performance

- Code splitting and lazy loading
- Optimized bundle size
- Image optimization
- Caching strategies
- CDN delivery on Render
