# Cafeteria Management System

A modern, role-based web application for managing school cafeteria operations. Built with Next.js 16, React 19, and Supabase for seamless meal tracking, payments, and administrative oversight.

## Overview

The Cafeteria Management System is designed to streamline meal distribution and payment tracking in educational institutions. It provides intuitive interfaces for three user roles: students, staff, and administrators, each with role-specific dashboards and features.

## Features

### Student Features
- **QR Code Generation**: Automatic QR code generation for meal tracking
- **Meal History**: View past meal records and transactions
- **Account Management**: Access personal account information
- **Real-time Updates**: Live meal availability information

### Staff Features
- **QR Scanner**: Scan student QR codes to log meals
- **Meal Logs**: Track meal distributions in real-time
- **Daily Reports**: View daily meal statistics
- **Quick Actions**: Fast meal entry and corrections

### Admin Features
- **Student Management**: Add, edit, and manage student records
- **Staff Management**: Manage cafeteria staff accounts and permissions
- **Payment Management**: Track and manage student payments
- **Financial Reports**: Comprehensive revenue and transaction reports
- **System Settings**: Configure system-wide settings and preferences
- **Analytics Dashboard**: Visual insights into cafeteria operations

## Technology Stack

- **Frontend**: Next.js 16, React 19.2, TypeScript
- **Styling**: Tailwind CSS 4.1, Tailwind Animations
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **QR Code**: react-qr-code

## Project Structure

\`\`\`
cafeteriasystem2/
├── app/
│   ├── page.tsx              # Main landing page
│   ├── layout.tsx            # Root layout with providers
│   └── globals.css           # Global styles and design tokens
├── components/
│   ├── auth/                 # Authentication components
│   │   └── Login.tsx
│   ├── student/              # Student-specific components
│   │   └── Dashboard.tsx
│   ├── staff/                # Staff-specific components
│   │   ├── Dashboard.tsx
│   │   ├── QRScanner.tsx
│   │   └── MealLogs.tsx
│   ├── admin/                # Admin-specific components
│   │   ├── Dashboard.tsx
│   │   ├── StudentManagement.tsx
│   │   ├── StaffManagement.tsx
│   │   ├── PaymentManagement.tsx
│   │   ├── Reports.tsx
│   │   └── SystemSettings.tsx
│   ├── layout/               # Shared layout components
│   │   └── Header.tsx
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── supabase.ts           # Supabase configuration
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript types
└── public/
    └── logo.png              # Application logo
\`\`\`

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account and project
- Environment variables configured

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
POSTGRES_HOST=your_postgres_host
POSTGRES_DATABASE=your_database_name
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
\`\`\`

### Installation Steps

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd cafeteriasystem2
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local` (if available)
   - Add your Supabase and database credentials

4. **Run development server**
   \`\`\`bash
   npm run dev
   # or
   pnpm dev
   \`\`\`

5. **Open in browser**
   - Navigate to `http://localhost:3000`

## Usage

### Login
1. Navigate to the login page
2. Select your role (Student, Staff, or Admin)
3. Enter your credentials and sign in

### Student Dashboard
- View your QR code for meal tracking
- Check meal history and past transactions
- Access account information

### Staff Dashboard
- Use the QR scanner to log student meals
- View meal logs for the day
- Access daily reports

### Admin Dashboard
- Access all management panels from the navigation
- Monitor cafeteria operations
- Generate financial and operational reports
- Manage users and system settings

## Development

### Available Scripts

\`\`\`bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check

# Watch mode for type checking
npm run type-check:watch
\`\`\`

### Code Structure Best Practices

- Components are organized by user role in `/components`
- Shared UI components are in `/components/ui`
- Business logic is separated from presentation
- TypeScript is used for type safety
- Supabase client is configured in `/lib/supabase.ts`

## Database Schema

The system uses Supabase PostgreSQL with the following main tables:

- **users**: User accounts with role information
- **students**: Student-specific data
- **staff**: Staff member information
- **meals**: Meal transaction records
- **payments**: Payment transaction history
- **settings**: System configuration settings

## Design System

The application features a modern design system with:
- **Primary Color**: Blue (#3B82F6)
- **Accent Color**: Teal (#14B8A6)
- **Neutral Colors**: Grays for backgrounds and borders
- **Typography**: Clean sans-serif fonts with proper hierarchy
- **Spacing**: Consistent 4px-based spacing scale
- **Animations**: Smooth transitions throughout the UI

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy with a single click

\`\`\`bash
vercel
\`\`\`

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Contributing

To contribute to this project:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## Troubleshooting

### Database Connection Issues
- Verify environment variables are correctly set
- Check Supabase project is active
- Ensure network access is configured

### QR Code Not Displaying
- Clear browser cache
- Check that react-qr-code is properly installed
- Verify student data is populated in the database

### Authentication Errors
- Confirm Supabase auth is enabled
- Check JWT secret is correct
- Verify user credentials in database

## Performance Optimizations

- Next.js 16 with App Router for optimal code splitting
- React 19 with server components for reduced client bundle size
- Tailwind CSS 4 for minimal CSS output
- Image optimization with next/image
- Efficient database queries with Supabase

## Security

- Row-Level Security (RLS) policies on all database tables
- Secure password hashing with Supabase Auth
- Environment variables for sensitive credentials
- CORS configured for Supabase
- TypeScript for type safety and error prevention

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue in the repository or contact the development team.

---

**Last Updated**: December 2025  
**Version**: 1.0.0
