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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Astral Chronos</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">Tasks</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/calendar">Calendar</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/goals">Goals</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/habits">Habits</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/planner">Planner</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/analytics">Analytics</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
          
          <PresenceIndicator className="ml-4" />
          
          {/* User Menu with Sign Out */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  {user.avatar ? (
                    <span className="text-lg">{user.avatar}</span>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden lg:inline-block">{user.displayName || user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || 'Demo User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={signOut}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
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