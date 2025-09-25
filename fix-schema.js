const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function fixSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Drop and recreate users table with correct schema
    await pool.query(`DROP TABLE IF EXISTS goal_progress, goal_milestones, goals, workspace_members, workspace_invites, workspaces, users CASCADE;`);
    
    // Create users table with exact Drizzle schema
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_id TEXT UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        image_url TEXT,
        username VARCHAR(50) UNIQUE,
        timezone VARCHAR(50) DEFAULT 'UTC',
        locale VARCHAR(10) DEFAULT 'en-US',
        settings JSONB DEFAULT '{"theme":"system","weekStart":"monday","timeFormat":"24h","dateFormat":"MM/dd/yyyy","defaultView":"day","workingHours":{"start":"09:00","end":"17:00","days":["monday","tuesday","wednesday","thursday","friday"]},"notifications":{"email":true,"push":true,"desktop":true,"reminders":true,"digest":"daily"},"privacy":{"showOnlineStatus":true,"allowDataCollection":true},"integrations":{"calendar":[],"communication":[],"productivity":[]}}',
        onboarding_completed BOOLEAN DEFAULT false,
        onboarding_step INTEGER DEFAULT 0,
        subscription JSONB DEFAULT '{"plan":"free","status":"active","periodStart":null,"periodEnd":null,"cancelAtPeriodEnd":false,"stripeCustomerId":null,"stripeSubscriptionId":null}',
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_tasks_created INTEGER DEFAULT 0,
        total_tasks_completed INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        ai_settings JSONB DEFAULT '{"enabled":true,"autoSuggestions":true,"planningAssistant":true,"naturalLanguage":true,"voiceInput":false,"smartScheduling":true,"insights":true}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);

    // Create workspaces table
    await pool.query(`
      CREATE TABLE workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(100) UNIQUE NOT NULL,
        owner_id UUID NOT NULL REFERENCES users(id),
        is_personal BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT false,
        color VARCHAR(7) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'folder',
        cover_image TEXT,
        settings JSONB DEFAULT '{"defaultView":"kanban","allowComments":true,"allowDuplicates":false,"autoArchive":false,"template":null,"integrations":{"calendar":false,"slack":false,"github":false},"permissions":{"allowGuests":false,"defaultRole":"viewer"}}',
        template_id UUID,
        is_template BOOLEAN DEFAULT false,
        members JSONB DEFAULT '[]',
        max_members INTEGER DEFAULT 10,
        is_archived BOOLEAN DEFAULT false,
        archived_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        deleted_at TIMESTAMP
      );
    `);

    // Create goals table with exact schema  
    await pool.query(`
      CREATE TABLE goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL,
        parent_goal_id UUID REFERENCES goals(id),
        workspace_id UUID NOT NULL REFERENCES workspaces(id),
        category VARCHAR(100),
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'not_started',
        progress INTEGER DEFAULT 0,
        target_value DECIMAL(10,2),
        current_value DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(50),
        start_date TIMESTAMP,
        target_date TIMESTAMP,
        completed_at TIMESTAMP,
        why TEXT,
        vision TEXT,
        rewards JSONB DEFAULT '[]',
        metrics JSONB DEFAULT '[]',
        milestones JSONB DEFAULT '[]',
        ai_suggestions JSONB DEFAULT '[]',
        predicted_completion_date TIMESTAMP,
        success_probability INTEGER,
        related_goals JSONB DEFAULT '[]',
        linked_blocks JSONB DEFAULT '[]',
        accountability JSONB DEFAULT '{}',
        reviews JSONB DEFAULT '[]',
        created_by UUID NOT NULL REFERENCES users(id),
        assigned_to UUID REFERENCES users(id),
        collaborators JSONB DEFAULT '[]',
        is_public BOOLEAN DEFAULT false,
        is_template BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        archived_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create goal_milestones table
    await pool.query(`
      CREATE TABLE goal_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID NOT NULL REFERENCES goals(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date TIMESTAMP,
        completed_at TIMESTAMP,
        target_value DECIMAL(10,2),
        is_completed BOOLEAN DEFAULT false,
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create goal_progress table
    await pool.query(`
      CREATE TABLE goal_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID NOT NULL REFERENCES goals(id),
        user_id UUID NOT NULL REFERENCES users(id),
        value DECIMAL(10,2) NOT NULL,
        note TEXT,
        progress_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log('✅ Database schema fixed successfully!');
    
    // Create test user for development
    const testUserResult = await pool.query(`
      INSERT INTO users (clerk_id, email, first_name, last_name) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (clerk_id) DO NOTHING
      RETURNING id, clerk_id, email, first_name, last_name
    `, ['test-user-id', 'test@example.com', 'Test', 'User']);
    
    console.log('✅ Test user created/found:', testUserResult.rows[0] || 'User already exists');
    
    // Test final query to ensure everything works
    const userCheck = await pool.query('SELECT COUNT(*) as count FROM users');
    const workspaceCheck = await pool.query('SELECT COUNT(*) as count FROM workspaces'); 
    const goalCheck = await pool.query('SELECT COUNT(*) as count FROM goals');
    
    console.log('📊 Final counts:');
    console.log(`  Users: ${userCheck.rows[0].count}`);
    console.log(`  Workspaces: ${workspaceCheck.rows[0].count}`);
    console.log(`  Goals: ${goalCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixSchema();