'use client';

import Link from 'next/link';
import { Calendar, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator';
import { useAuth } from '@/components/providers/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-800/30 backdrop-blur-xl bg-slate-900/80 shadow-lg shadow-purple-900/20">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Calendar className="h-6 w-6 text-purple-400 group-hover:text-pink-400 transition-colors" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Astral Chronos
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/calendar">Calendar</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/planner">Planner</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/goals">Goals</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/habits">Habits</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/analytics">Analytics</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
            <Link href="/settings">Settings</Link>
          </Button>
          
          <PresenceIndicator className="ml-4" />
          
          {/* User Menu with Sign Out */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
                  {user.avatar ? (
                    <span className="text-lg">{user.avatar}</span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden lg:inline-block">{user.displayName || user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-slate-900/95 border-purple-800/30">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-purple-100">{user.name}</p>
                    <p className="text-xs leading-none text-purple-300/70">
                      {user.email || 'Demo User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-purple-800/30" />
                <DropdownMenuItem asChild className="text-purple-200 hover:text-purple-100 hover:bg-purple-950/50">
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-800/30" />
                <DropdownMenuItem 
                  onClick={signOut}
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}