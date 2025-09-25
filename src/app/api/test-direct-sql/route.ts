import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'DATABASE_URL not configured'
      }, { status: 500 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test direct SQL queries
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const workspaceCount = await pool.query('SELECT COUNT(*) as count FROM workspaces');
    const goalCount = await pool.query('SELECT COUNT(*) as count FROM goals');
    
    // Test finding our test user
    const testUser = await pool.query('SELECT * FROM users WHERE clerk_id = $1', ['test-user-id']);
    
    await pool.end();
    
    return NextResponse.json({
      status: 'success',
      message: 'Direct SQL queries working',
      counts: {
        users: parseInt(userCount.rows[0].count),
        workspaces: parseInt(workspaceCount.rows[0].count),
        goals: parseInt(goalCount.rows[0].count)
      },
      testUser: testUser.rows[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct SQL test error:', error);
    return NextResponse.json({
      error: 'Direct SQL test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}