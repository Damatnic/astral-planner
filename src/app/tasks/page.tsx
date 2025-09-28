import { redirect } from 'next/navigation';

// Tasks page redirects to planner (where tasks are managed)
export default function TasksPage() {
  redirect('/planner');
}