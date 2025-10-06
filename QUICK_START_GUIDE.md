# Astral Planner - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

---

## 📦 Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local

# 3. Edit .env.local with your keys (optional for demo)
# For demo mode, you can skip this step
```

---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Visit: http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

---

## 🎯 Demo Accounts

### Demo User
- **Account ID:** `demo-user`
- **PIN:** `0000`
- **Features:** Basic habits, goals, and tasks

### Nick's Planner
- **Account ID:** `nick-planner`
- **PIN:** `1234`
- **Features:** Business-focused habits and goals

---

## 🔑 Key Features

### ✅ Working Features:
- 📅 **Smart Calendar** - Time blocking and scheduling
- ✅ **Task Management** - Create, edit, complete tasks
- 🎯 **Goal Tracking** - Set and monitor goals
- 🔄 **Habit Tracking** - Build and maintain habits
- 📊 **Analytics Dashboard** - View productivity metrics
- 🎨 **Templates** - Pre-built productivity templates
- 📱 **Responsive Design** - Works on all devices
- 🌙 **Dark Mode** - Theme customization
- ⚡ **PWA Support** - Install as app

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Main dashboard
│   ├── calendar/          # Calendar view
│   ├── habits/            # Habit tracking
│   ├── goals/             # Goal management
│   ├── tasks/             # Task management
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utilities and helpers
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

---

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run dev:7000` - Start on port 7000
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Check TypeScript types

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report
- `npm run test:e2e` - End-to-end tests

### Building
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run analyze` - Analyze bundle size

### Quality Assurance
- `npm run quality:assurance` - Run QA checks
- `npm run error:detection` - Detect errors
- `npm run performance:test` - Performance tests

---

## 🔧 Configuration

### Environment Variables

#### Required (for production):
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

#### Optional:
```env
# Database
DATABASE_URL=postgresql://...

# AI Features
OPENAI_API_KEY=sk-...

# Real-time
PUSHER_APP_ID=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_KEY=...

# Monitoring
SENTRY_DSN=...
```

---

## 📱 Using the Application

### 1. Dashboard
- View today's tasks, habits, and goals
- Quick stats and productivity score
- Recent activity feed

### 2. Calendar
- Month, week, day, and agenda views
- Time blocking for deep work
- AI-powered scheduling suggestions
- Drag-and-drop event management

### 3. Tasks
- Create tasks with priorities
- Set due dates and categories
- Mark as complete
- Filter and search

### 4. Habits
- Track daily habits
- View streaks and completion rates
- Set reminders
- Weekly patterns

### 5. Goals
- Set short and long-term goals
- Track progress percentage
- Set deadlines
- Link to tasks

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
npm run test:clear
rm -rf .next
npm run build
```

### Port Already in Use
```bash
# Use different port
npm run dev:7000
```

### Tests Failing
```bash
# Clear Jest cache
npm run test:clear
npm test
```

### TypeScript Errors
```bash
# Check types
npm run type-check

# Skip lib check (faster)
npm run type-check
```

---

## 📚 Documentation

- **API Documentation:** `API_DOCUMENTATION.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Development Guide:** `DEVELOPMENT_GUIDE.md`
- **Fixes Summary:** `FIXES_COMPLETE_SUMMARY.md`

---

## 🤝 Support

### Common Issues:

**Q: Calendar not loading?**
A: Check browser console for errors. Ensure JavaScript is enabled.

**Q: Demo account not working?**
A: Use PIN `0000` for demo-user or `1234` for nick-planner.

**Q: Build warnings?**
A: Warnings are normal. Only errors prevent deployment.

**Q: Environment variables not loading?**
A: Ensure `.env.local` exists and restart dev server.

---

## 🎉 You're Ready!

The application is fully functional and ready to use. Start with the demo account to explore features, then customize for your needs.

### Next Steps:
1. ✅ Run `npm run dev`
2. ✅ Visit http://localhost:3000
3. ✅ Login with demo account (PIN: 0000)
4. ✅ Explore the features
5. ✅ Customize for your workflow

---

**Happy Planning! 📅✨**
