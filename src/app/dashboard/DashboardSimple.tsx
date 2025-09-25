'use client';

export default function DashboardSimple() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Simple dashboard without complex components to isolate error source.</p>
      
      <div className="grid gap-4 mt-8">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Test Card 1</h2>
          <p>This is a simple test card.</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold">Test Card 2</h2>
          <p>Another simple test card.</p>
        </div>
      </div>
    </div>
  );
}