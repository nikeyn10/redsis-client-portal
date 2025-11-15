# REDSIS Client Portal

A modern, secure client portal built with Next.js 15, TypeScript, and Tailwind CSS for ticket management and customer support.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?logo=tailwindcss)

## 🚀 Features

- **🔐 Magic Link Authentication** - Secure, passwordless login via email
- **🎫 Ticket Management** - Create, view, and manage support tickets
- **⚡ Real-time Updates** - Live ticket updates via WebSocket
- **📱 Responsive Design** - Mobile-first design with Tailwind CSS
- **🔒 TypeScript** - Full type safety throughout the application
- **🎨 Modern UI** - Beautiful, accessible component library
- **🚄 Next.js 15** - Latest App Router with Server Components

## 🏗️ Tech Stack

- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **HTTP Client**: Axios
- **Real-time**: Socket.io WebSocket
- **Authentication**: JWT with Magic Links
- **State Management**: React Hooks + Jotai
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nikeyn10/redsis-client-portal.git
   cd redsis-client-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your backend configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Quick Start

### Development
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Magic Link Authentication
Users authenticate via magic links sent to their email:
```
https://portal.redsis.com/login?portal_id={client_id}&token={jwt_token}
```

## 📁 Project Structure

```
├── app/
│   ├── (public)/           # Public routes (no auth required)
│   │   └── login/         # Magic link authentication
│   ├── (auth)/            # Protected routes (auth required)
│   │   ├── layout.tsx     # Auth guard + navigation
│   │   ├── dashboard/     # Main dashboard
│   │   └── tickets/[id]/  # Individual ticket view
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── TopNav.tsx        # Navigation component
│   ├── TicketList.tsx    # Tickets table
│   └── ...
├── lib/
│   ├── api/
│   │   └── client.ts     # API client & endpoints
│   ├── auth.ts           # Authentication utilities
│   └── ws.ts             # WebSocket connection
├── types/
│   └── index.ts          # TypeScript type definitions
└── Configuration files
```

## 🔐 Authentication Flow

1. **Magic Link Generation**: Backend generates secure link with JWT
2. **Email Delivery**: Link sent to client's registered email
3. **Token Validation**: Frontend validates token with backend
4. **Session Creation**: JWT stored in localStorage for API calls
5. **Auto-Logout**: Expired tokens automatically redirect to login

## 🎨 UI Components

The project includes a comprehensive UI component library:

- **Button** - Multiple variants (primary, secondary, ghost, danger)
- **Card** - Container components with consistent styling
- **Input/Textarea** - Form controls with validation states
- **Badge** - Status indicators with color variants
- **Loader** - Loading spinners in multiple sizes
- **Table** - Data tables with sorting and filtering

## 🔌 API Integration

### Backend Requirements
The frontend expects a FastAPI backend with these endpoints:

- `GET /auth/{portal_id}/{token}` - Magic link authentication
- `GET /me` - Current user information
- `GET /tickets/{portal_id}` - User's tickets
- `POST /ticket` - Create new ticket
- WebSocket at `/ws` - Real-time updates

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket URL | `ws://localhost:8000` |

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Build
```bash
npm run build
npm start
```

## 🧪 Testing

Currently testing with mock data. To test with real backend:

1. Start your FastAPI backend on port 8000
2. Update `.env.local` with correct URLs
3. Test magic link flow: `/login?portal_id=test&token=jwt_token`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ for REDSIS**# Full CRUD Management Portal
