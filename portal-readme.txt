# REDSIS Client Portal - Frontend

A modern, secure client portal built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running (FastAPI)

### Installation

```bash
# Clone or create the project
npx create-next-app@latest client-portal --typescript --tailwind --app --src-dir=false --import-alias="@/*"

cd client-portal

# Install all dependencies
npm install axios jotai zod jsonwebtoken socket.io-client lucide-react clsx
npm install -D @types/jsonwebtoken @tailwindcss/forms

# Create environment file
cp .env.local.example .env.local
# Edit .env.local with your backend URL
```

### Environment Configuration

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000
```

For production (https://portal.redsis.com):
```env
NEXT_PUBLIC_API_URL=https://api.redsis.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.redsis.com
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
client-portal/
├── app/
│   ├── (public)/           # Public routes (no auth)
│   │   └── login/
│   ├── (auth)/            # Protected routes
│   │   ├── layout.tsx     # Auth guard + TopNav
│   │   ├── dashboard/     # Main dashboard
│   │   └── tickets/[id]/  # Individual ticket view
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   ├── Loader.tsx
│   │   ├── Textarea.tsx
│   │   └── Select.tsx
│   ├── TopNav.tsx         # Navigation bar
│   ├── TicketList.tsx     # Tickets table
│   ├── TicketDetail.tsx   # Ticket detail view
│   └── NewTicketForm.tsx  # Create ticket form
├── lib/
│   ├── api/
│   │   └── client.ts      # API client & endpoints
│   ├── auth.ts            # Auth utilities
│   └── ws.ts              # WebSocket connection
├── types/
│   └── index.ts           # TypeScript types
└── Configuration files
```

## 🔐 Authentication Flow

1. **Magic Link**: User receives email with magic link
   - Format: `https://portal.redsis.com/login?portal_id={id}&token={token}`

2. **Token Exchange**: Frontend calls backend auth endpoint
   - Backend validates token and returns JWT

3. **JWT Storage**: Frontend stores JWT in localStorage
   - Key: `portal_auth_token`

4. **Auto-attach**: All API requests include JWT via interceptor
   - Header: `Authorization: Bearer {token}`

5. **Auto-logout**: 401 responses trigger automatic logout

## 🎯 Features

### Dashboard (`/dashboard`)
- Welcome message with user info
- Ticket statistics (Total, Open, Resolved)
- Complete ticket list with status/priority
- Create new ticket button
- Real-time updates via WebSocket

### Ticket Detail (`/tickets/{id}`)
- Full ticket information
- Status and priority badges
- Comments section
- Add new comments
- Back to dashboard navigation

### New Ticket Form
- Title input (required)
- Description textarea (required)
- Priority selector (low/medium/high/urgent)
- Client-side validation
- Success callback

## 🔌 API Integration

### Endpoints Used

```typescript
// Authentication
GET  /auth/{portal_id}/{token}  // Magic link auth
GET  /me                        // Current user info
POST /auth/refresh              // Token refresh

// Tickets
GET  /tickets/{portal_id}       // List tickets
POST /ticket                    // Create ticket

// Future endpoints (mocked)
GET  /tickets/{portal_id}/{ticket_id}  // Single ticket
POST /tickets/{ticket_id}/comments     // Add comment
GET  /tickets/{ticket_id}/comments     // List comments
```

### Error Handling
- 401 Unauthorized → Auto-logout and redirect
- Network errors → Logged to console
- Validation errors → Displayed inline

## 🔄 Real-time Updates

WebSocket connection established on dashboard mount:

```typescript
// Events received
{
  type: 'ticket_created' | 'ticket_updated' | 'comment_added',
  ticket_id: string,
  data: any
}
```

## 🎨 Styling

### Colors
- **Primary**: Monday Blue (#0073EA)
- **Background**: White (#FFFFFF)
- **Text**: Gray scale
- **Accents**: Status-based colors

### Status Colors
- Open → Blue
- In Progress → Yellow
- Resolved → Green
- Closed → Gray

### Priority Colors
- Low → Gray
- Medium → Blue
- High → Yellow
- Urgent → Red

## 🛡️ Security

- **No secrets in frontend**: All sensitive data on backend
- **JWT validation**: Backend only
- **Workspace lock**: Backend enforces workspace 4655994
- **XSS protection**: React auto-escaping
- **CORS**: Configured on backend

## 📦 Dependencies

### Core
- `next`: ^14.0.4 - React framework
- `react`: ^18.2.0 - UI library
- `typescript`: ^5 - Type safety

### State & Data
- `axios`: ^1.6.0 - HTTP client
- `jotai`: ^2.6.0 - State management (minimal usage)
- `zod`: ^3.22.4 - Schema validation

### Auth & Real-time
- `jsonwebtoken`: ^9.0.2 - JWT decoding
- `socket.io-client`: ^4.5.4 - WebSocket client

### UI & Styling
- `tailwindcss`: ^3.3.0 - CSS framework
- `@tailwindcss/forms`: ^0.5.7 - Form styling
- `lucide-react`: ^0.294.0 - Icons
- `clsx`: ^2.0.0 - Conditional classes

## 🧪 Development

### Type Safety
All API responses and components are fully typed with TypeScript.

### Code Organization
- Components follow single responsibility
- API calls isolated in client.ts
- Auth logic in dedicated auth.ts
- WebSocket in dedicated ws.ts

### Best Practices
- ✅ Server Components where possible
- ✅ Client Components for interactivity
- ✅ Error boundaries (built-in)
- ✅ Loading states everywhere
- ✅ Accessibility (ARIA labels, keyboard nav)

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WEBSOCKET_URL`

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Notes

### Workspace Lock
- Workspace ID `4655994` is hardcoded in backend
- Frontend never exposes this ID
- Backend validates all requests against this workspace

### Future Enhancements
- [ ] Single ticket endpoint (GET /tickets/{portal_id}/{id})
- [ ] Comments API (POST/GET /tickets/{id}/comments)
- [ ] File attachments
- [ ] Ticket assignment
- [ ] Email notifications
- [ ] Search & filtering
- [ ] Mobile responsive improvements

### Known Limitations
- Comments currently mocked (placeholder implementation)
- Single ticket fetch uses list + filter (temporary)
- No file upload support yet

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### API connection fails
- Check backend is running
- Verify `.env.local` has correct URLs
- Check CORS configuration on backend

### Authentication loop
- Clear localStorage: `localStorage.clear()`
- Check token expiration (backend issue)
- Verify magic link format

### WebSocket not connecting
- Check WebSocket URL in `.env.local`
- Verify backend WebSocket support
- Check browser console for errors

## 📧 Support

For issues or questions:
- Check backend logs
- Review browser console
- Verify environment variables
- Contact: support@redsis.com

## 📄 License

Proprietary - REDSIS Internal Use Only

---

**Built with ❤️ using Next.js 14**