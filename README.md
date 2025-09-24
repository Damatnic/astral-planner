# 🚀 Ultimate Digital Planner

The world's most advanced digital planning system with AI-powered insights, time blocking, goal tracking, and seamless integrations.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/astral-planner)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)

## ✨ Features

### 🎯 Core Planning
- **AI-Powered Natural Language Input** - Type naturally and let AI organize your tasks with OpenAI GPT-4
- **Smart Task Management** - Priority-based organization with due dates, tags, and attachments
- **Goal Hierarchy System** - Break down lifetime goals into measurable milestones and daily tasks
- **Habit Tracking** - Visual streak tracking with customizable schedules and reminder notifications
- **Time Blocking Calendar** - Visual calendar with drag-and-drop scheduling and conflict detection

### 🚀 Advanced Features
- **Real-time Collaboration** - Live presence indicators, cursor tracking, and instant updates via Pusher
- **Google Calendar Integration** - Two-way sync with OAuth 2.0 authentication and selective event syncing
- **Template Marketplace** - Community-driven templates for GTD, PARA, Eisenhower Matrix, and more
- **Analytics Dashboard** - Interactive charts showing productivity trends, goal progress, and habit streaks
- **Multi-format Export** - Export your data as JSON, CSV, or PDF for backup and portability
- **Offline Mode** - Service worker enabled PWA with automatic background sync
- **Mobile Optimized** - Responsive design with bottom navigation, swipe gestures, and touch targets

### 📱 Progressive Web App (PWA)
- **Install on Any Device** - Add to home screen on iOS, Android, Windows, and macOS
- **Offline Functionality** - Work without internet and sync when reconnected
- **Push Notifications** - Get reminders and updates even when app is closed
- **Background Sync** - Automatic data synchronization in the background

### 🔒 Security & Privacy
- **End-to-end Encryption** - Your data is encrypted at rest and in transit
- **Role-based Access Control** - Granular permissions for workspaces and collaborators
- **Two-factor Authentication** - Enhanced security with 2FA via Clerk
- **Data Export & Deletion** - Full control over your data with GDPR compliance

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, tRPC
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Clerk
- **Real-time**: Pusher Channels
- **AI**: OpenAI GPT-4, Vercel AI SDK
- **Deployment**: Vercel
- **Monitoring**: Sentry, Vercel Analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm
- PostgreSQL database (or use Neon)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/astral-planner.git

# Navigate to project directory
cd astral-planner

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/astral-planner)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## 📖 API Documentation

### REST API Endpoints

- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/ai/parse` - Parse natural language
- `GET /api/calendar/events` - Get events

## 🏗️ Project Structure

```
astral-planner/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── features/        # Feature modules
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   └── db/              # Database schema
├── public/              # Static assets
└── tests/               # Test files
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- [Documentation](https://docs.astralplanner.com)
- [Discord Community](https://discord.gg/astralplanner)
- [GitHub Issues](https://github.com/yourusername/astral-planner/issues)

---

Built with ❤️ by the Ultimate Digital Planner Team