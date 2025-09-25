import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import Logger from '@/lib/logger';

async function handleGET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      // Redirect to dashboard if no URL provided
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }

    // Parse the custom protocol URL (web+planner://action?params)
    try {
      const protocolUrl = new URL(url.replace('web+planner://', 'https://'));
      const action = protocolUrl.hostname; // The action after web+planner://
      const params = protocolUrl.searchParams;

      Logger.info('Protocol handler invoked:', { action, url });

      // Handle different protocol actions
      switch (action) {
        case 'task':
          // web+planner://task?title=Task%20Name&description=Description
          const dashboardUrl = new URL('/dashboard', req.nextUrl.origin);
          dashboardUrl.searchParams.set('action', 'new-task');
          
          const title = params.get('title');
          const description = params.get('description');
          const priority = params.get('priority');
          const dueDate = params.get('due');

          if (title) dashboardUrl.searchParams.set('title', title);
          if (description) dashboardUrl.searchParams.set('description', description);
          if (priority) dashboardUrl.searchParams.set('priority', priority);
          if (dueDate) dashboardUrl.searchParams.set('due', dueDate);

          return NextResponse.redirect(dashboardUrl.toString());

        case 'goal':
          // web+planner://goal?title=Goal%20Name
          const goalsUrl = new URL('/goals', req.nextUrl.origin);
          goalsUrl.searchParams.set('action', 'new-goal');
          
          const goalTitle = params.get('title');
          const goalDescription = params.get('description');

          if (goalTitle) goalsUrl.searchParams.set('title', goalTitle);
          if (goalDescription) goalsUrl.searchParams.set('description', goalDescription);

          return NextResponse.redirect(goalsUrl.toString());

        case 'habit':
          // web+planner://habit?name=Habit%20Name
          const habitsUrl = new URL('/habits', req.nextUrl.origin);
          habitsUrl.searchParams.set('action', 'new-habit');
          
          const habitName = params.get('name');
          const habitCategory = params.get('category');

          if (habitName) habitsUrl.searchParams.set('name', habitName);
          if (habitCategory) habitsUrl.searchParams.set('category', habitCategory);

          return NextResponse.redirect(habitsUrl.toString());

        case 'calendar':
          // web+planner://calendar?date=2024-01-01
          const calendarUrl = new URL('/calendar', req.nextUrl.origin);
          
          const date = params.get('date');
          if (date) calendarUrl.searchParams.set('date', date);

          return NextResponse.redirect(calendarUrl.toString());

        default:
          // Unknown action, redirect to dashboard
          return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
      }
    } catch (error) {
      Logger.error('Protocol URL parsing error:', error);
      // Fallback to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
  } catch (error) {
    Logger.error('Protocol handler error:', error);
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }
}

export const GET = withAuth(handleGET);