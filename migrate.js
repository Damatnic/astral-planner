const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        image_url TEXT,
        username VARCHAR(255),
        timezone VARCHAR(50) DEFAULT 'UTC',
        locale VARCHAR(10) DEFAULT 'en',
        settings JSONB DEFAULT '{}',
        onboarding_completed BOOLEAN DEFAULT false,
        onboarding_step INTEGER DEFAULT 0,
        subscription VARCHAR(50) DEFAULT 'free',
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_tasks_created INTEGER DEFAULT 0,
        total_tasks_completed INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        ai_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    // Create workspaces table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        owner_id UUID NOT NULL REFERENCES users(id),
        is_personal BOOLEAN DEFAULT false,
        color VARCHAR(7) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'workspace',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    // Create goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'monthly' CHECK (type IN ('lifetime', 'yearly', 'quarterly', 'monthly', 'weekly', 'daily')),
        category VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        target_value VARCHAR(255) DEFAULT '100',
        current_value VARCHAR(255) DEFAULT '0',
        target_date TIMESTAMP,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_date TIMESTAMP,
        parent_goal_id UUID REFERENCES goals(id),
        created_by UUID NOT NULL REFERENCES users(id),
        assigned_to UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    // Create habits table  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
        target_value INTEGER DEFAULT 1,
        unit VARCHAR(50) DEFAULT 'times',
        color VARCHAR(7) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'check',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
        reminder_enabled BOOLEAN DEFAULT false,
        reminder_time TIME,
        reminder_days VARCHAR(20) DEFAULT 'daily',
        streak_count INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        total_completions INTEGER DEFAULT 0,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    // Create templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'goal' CHECK (type IN ('goal', 'habit', 'project', 'routine')),
        is_public BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
        estimated_duration VARCHAR(50),
        tags TEXT[],
        template_data JSONB NOT NULL DEFAULT '{}',
        usage_count INTEGER DEFAULT 0,
        rating_avg DECIMAL(2,1) DEFAULT 0.0,
        rating_count INTEGER DEFAULT 0,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);

    console.log('Migration completed successfully!');
    
    // Test the tables
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Users table exists, count:', result.rows[0].count);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();