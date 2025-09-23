# NagarSetu - Civic Problem Reporting PWA

A Progressive Web App designed to empower citizens to report civic problems efficiently through a streamlined mobile-first interface.

## Features

- **Multi-photo capture** with client-side compression
- **AI-powered department suggestion** using OpenAI GPT-4o
- **Offline functionality** with automatic synchronization
- **Location services** with GPS and manual input
- **Real-time status tracking** with timeline
- **Push notifications** for status updates
- **PWA capabilities** for native app-like experience

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI**: Google Gemini 1.5 Flash
- **PWA**: Vite PWA Plugin + Workbox

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nagarsetu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema (see `supabase/schema.sql`)
   - Enable Row Level Security (RLS)
   - Set up storage bucket for images

5. Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Network, Offline)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # External service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main app component
```

## Key Features Implementation

### Offline Functionality
- Uses IndexedDB for local storage
- Service Worker for background sync
- Queue management with retry logic

### AI Department Suggestion
- Google Gemini 1.5 Flash integration
- Fallback keyword matching
- Confidence scoring

### Image Handling
- Client-side compression to 1.5MB
- Multiple format support
- Thumbnail generation

### Location Services
- GPS-based location capture
- Reverse geocoding
- Manual location input

## Deployment

The app is designed to be deployed as a static site. Popular options include:

- **Vercel**: `vercel --prod`
- **Netlify**: Connect your Git repository
- **GitHub Pages**: Use GitHub Actions
- **Firebase Hosting**: `firebase deploy`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

# NagarSetu
