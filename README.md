# FocusNest

A modern productivity tracking web application built with React, TypeScript, and Supabase. FocusNest helps you monitor your online activity, block distracting websites, and maintain focus during work sessions.

## Features

- **Productivity Dashboard**: Track your daily productivity metrics and time spent on different activities
- **Website Blocking**: Block distracting websites during focus sessions
- **Real-time Analytics**: View charts and graphs of your browsing habits
- **User Authentication**: Secure user accounts with Supabase
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Query, Context API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- bun or npm
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd focus-nest-temp
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up Supabase**

   Create a new project at [supabase.com](https://supabase.com) and get your project URL and anon key.

4. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up the database**

   Run the SQL commands in `SUPABASE_SETUP.md` to create the necessary tables and policies.

6. **Start the development server**
   ```bash
   bun  dev
   ```

   The application will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout component
│   └── NavLink.tsx     # Navigation link component
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── pages/              # Page components
└── App.tsx             # Main application component
```

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun preview` - Preview production build
- `bun lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
