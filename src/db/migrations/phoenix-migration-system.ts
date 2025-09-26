/**
 * PHOENIX ULTIMATE DATABASE MIGRATION SYSTEM v2.0
 * Zero-downtime migrations with rollback capabilities and performance monitoring
 * Enterprise-grade migration management for production environments
 */

import { Pool } from '@neondatabase/serverless';
import Logger from '../../lib/logger';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// PHOENIX MIGRATION TYPES AND INTERFACES
// ============================================================================

interface Migration {
  version: string;
  name: string;
  description: string;
  up: string[];
  down: string[];
  dependencies?: string[];
  estimatedDuration?: number; // in seconds
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  canRunInProduction: boolean;
  requiresDowntime: boolean;
  affectedTables: string[];
  backupRequired: boolean;
}

interface MigrationResult {
  version: string;
  success: boolean;
  duration: number;
  error?: string;
  warnings: string[];
  rollbackAvailable: boolean;
}

interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date;
  duration: number;
  checksum: string;
  rollbackScript?: string;
}

// ============================================================================
// PHOENIX MIGRATION MANAGER
// ============================================================================

export class PhoenixMigrationManager {
  private pool: Pool;
  private migrationsPath: string;
  private schemaTable = 'phoenix_schema_migrations';

  constructor(connectionConfig: any, migrationsPath = './migrations') {
    this.pool = new Pool(connectionConfig);
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize the migration system
   */
  async initialize(): Promise<void> {
    await this.createMigrationTable();
    Logger.info('Phoenix Migration System initialized');
  }

  /**
   * Create the migrations tracking table
   */
  private async createMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.schemaTable} (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        duration INTEGER NOT NULL DEFAULT 0,
        checksum VARCHAR(64) NOT NULL,
        rollback_script TEXT,
        created_by VARCHAR(255) DEFAULT USER,
        environment VARCHAR(50) DEFAULT 'unknown',
        git_commit VARCHAR(40),
        application_version VARCHAR(50)
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
        ON ${this.schemaTable}(applied_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_environment 
        ON ${this.schemaTable}(environment, applied_at DESC);
    `;

    try {
      await this.pool.query(sql);
      Logger.info('Migration tracking table created/verified');
    } catch (error) {
      Logger.error('Failed to create migration table:', error);
      throw error;
    }
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationStatus[]> {
    const result = await this.pool.query(`
      SELECT version, name, applied_at, duration, checksum, rollback_script
      FROM ${this.schemaTable}
      ORDER BY applied_at ASC
    `);

    return result.rows.map(row => ({
      version: row.version,
      name: row.name,
      appliedAt: row.applied_at,
      duration: row.duration,
      checksum: row.checksum,
      rollbackScript: row.rollback_script,
    }));
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    const allMigrations = await this.loadMigrations();
    return allMigrations.filter(m => !appliedVersions.has(m.version));
  }

  /**
   * Load all migration files
   */
  private async loadMigrations(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.json')).sort();
      
      const migrations: Migration[] = [];
      
      for (const file of migrationFiles) {
        const filePath = path.join(this.migrationsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const migration = JSON.parse(content) as Migration;
        migrations.push(migration);
      }
      
      return migrations;
    } catch (error) {
      Logger.error('Failed to load migrations:', error);
      throw error;
    }
  }

  /**
   * Run a single migration with comprehensive monitoring
   */
  async runMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    
    Logger.info(`Starting migration: ${migration.version} - ${migration.name}`);
    
    // Pre-migration checks
    if (migration.requiresDowntime) {
      warnings.push('This migration requires downtime');
    }
    
    if (migration.backupRequired) {
      warnings.push('Backup recommended before running this migration');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute migration statements
      for (const statement of migration.up) {
        const statementStart = Date.now();
        
        try {
          await client.query(statement);
          const statementDuration = Date.now() - statementStart;
          
          if (statementDuration > 5000) {
            warnings.push(`Statement took ${statementDuration}ms: ${statement.substring(0, 100)}...`);
          }
        } catch (error) {
          Logger.error(`Migration statement failed: ${statement}`, error);
          throw error;
        }
      }
      
      // Record the migration
      const duration = Date.now() - startTime;
      const checksum = this.calculateChecksum(migration);
      
      await client.query(`
        INSERT INTO ${this.schemaTable} 
        (version, name, description, duration, checksum, rollback_script, environment, git_commit, application_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        migration.version,
        migration.name,
        migration.description,
        duration,
        checksum,
        migration.down.join(';\n'),
        process.env.NODE_ENV || 'unknown',
        process.env.GIT_COMMIT || null,
        process.env.APP_VERSION || null,
      ]);
      
      await client.query('COMMIT');
      
      Logger.info(`Migration completed successfully: ${migration.version} (${duration}ms)`);
      
      return {
        version: migration.version,
        success: true,
        duration,
        warnings,
        rollbackAvailable: migration.down.length > 0,
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      const duration = Date.now() - startTime;
      
      Logger.error(`Migration failed: ${migration.version}`, error);
      
      return {
        version: migration.version,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings,
        rollbackAvailable: false,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<MigrationResult[]> {
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      Logger.info('No pending migrations');
      return [];
    }
    
    Logger.info(`Found ${pendingMigrations.length} pending migrations`);
    
    const results: MigrationResult[] = [];
    
    for (const migration of pendingMigrations) {
      // Check dependencies
      const dependenciesMet = await this.checkDependencies(migration);
      if (!dependenciesMet) {
        results.push({
          version: migration.version,
          success: false,
          duration: 0,
          error: 'Dependencies not met',
          warnings: [`Skipped due to unmet dependencies: ${migration.dependencies?.join(', ')}`],
          rollbackAvailable: false,
        });
        continue;
      }
      
      const result = await this.runMigration(migration);
      results.push(result);
      
      // Stop on first failure
      if (!result.success) {
        Logger.error('Migration failed, stopping migration process');
        break;
      }
    }
    
    return results;
  }

  /**
   * Rollback a specific migration
   */
  async rollback(version: string): Promise<MigrationResult> {
    const startTime = Date.now();
    
    Logger.info(`Starting rollback of migration: ${version}`);
    
    // Get the migration record
    const result = await this.pool.query(`
      SELECT version, name, rollback_script
      FROM ${this.schemaTable}
      WHERE version = $1
    `, [version]);
    
    if (result.rows.length === 0) {
      return {
        version,
        success: false,
        duration: 0,
        error: 'Migration not found in database',
        warnings: [],
        rollbackAvailable: false,
      };
    }
    
    const migration = result.rows[0];
    if (!migration.rollback_script) {
      return {
        version,
        success: false,
        duration: 0,
        error: 'No rollback script available',
        warnings: [],
        rollbackAvailable: false,
      };
    }
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute rollback statements
      const statements = migration.rollback_script.split(';').filter((s: string) => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement);
        }
      }
      
      // Remove the migration record
      await client.query(`
        DELETE FROM ${this.schemaTable}
        WHERE version = $1
      `, [version]);
      
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      Logger.info(`Rollback completed successfully: ${version} (${duration}ms)`);
      
      return {
        version,
        success: true,
        duration,
        warnings: [],
        rollbackAvailable: false,
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      const duration = Date.now() - startTime;
      
      Logger.error(`Rollback failed: ${version}`, error);
      
      return {
        version,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: [],
        rollbackAvailable: true,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Generate a new migration file
   */
  async generateMigration(name: string, description: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
    const version = `${timestamp}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const migration: Migration = {
      version,
      name,
      description,
      up: [
        '-- Add your migration SQL here',
        '-- Example: CREATE TABLE example (id UUID PRIMARY KEY, name VARCHAR(255));',
      ],
      down: [
        '-- Add your rollback SQL here',
        '-- Example: DROP TABLE IF EXISTS example;',
      ],
      dependencies: [],
      estimatedDuration: 1,
      criticalityLevel: 'medium',
      canRunInProduction: true,
      requiresDowntime: false,
      affectedTables: [],
      backupRequired: false,
    };
    
    const filename = `${version}.json`;
    const filepath = path.join(this.migrationsPath, filename);
    
    await fs.writeFile(filepath, JSON.stringify(migration, null, 2));
    
    Logger.info(`Generated migration file: ${filename}`);
    return filepath;
  }

  /**
   * Check if migration dependencies are met
   */
  private async checkDependencies(migration: Migration): Promise<boolean> {
    if (!migration.dependencies || migration.dependencies.length === 0) {
      return true;
    }
    
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    return migration.dependencies.every(dep => appliedVersions.has(dep));
  }

  /**
   * Calculate migration checksum for integrity verification
   */
  private calculateChecksum(migration: Migration): string {
    const crypto = require('crypto');
    const content = JSON.stringify({
      up: migration.up,
      down: migration.down,
      version: migration.version,
    });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate database schema integrity
   */
  async validateSchema(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check for missing indexes from our optimization script
      const criticalIndexes = [
        'idx_users_phoenix_auth_ultra_fast',
        'idx_blocks_phoenix_dashboard_ultra',
        'idx_events_phoenix_calendar_ultra_fast',
      ];
      
      for (const indexName of criticalIndexes) {
        const result = await this.pool.query(`
          SELECT indexname FROM pg_indexes 
          WHERE indexname = $1
        `, [indexName]);
        
        if (result.rows.length === 0) {
          issues.push(`Missing critical index: ${indexName}`);
        }
      }
      
      // Check for table statistics
      const result = await this.pool.query(`
        SELECT schemaname, tablename, n_live_tup, last_analyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        AND (last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '1 week')
      `);
      
      if (result.rows.length > 0) {
        issues.push(`Tables need ANALYZE: ${result.rows.map((r: any) => r.tablename).join(', ')}`);
      }
      
      return {
        valid: issues.length === 0,
        issues,
      };
      
    } catch (error) {
      return {
        valid: false,
        issues: [`Schema validation error: ${error}`],
      };
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// PHOENIX MIGRATION UTILITIES
// ============================================================================

export class PhoenixMigrationUtils {
  /**
   * Create a backup of specific tables before migration
   */
  static async createBackup(pool: Pool, tables: string[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
    const backupSuffix = `_backup_${timestamp}`;
    
    for (const table of tables) {
      await pool.query(`
        CREATE TABLE ${table}${backupSuffix} AS 
        SELECT * FROM ${table}
      `);
    }
    
    Logger.info(`Created backup tables with suffix: ${backupSuffix}`);
    return backupSuffix;
  }

  /**
   * Restore from backup
   */
  static async restoreFromBackup(pool: Pool, tables: string[], backupSuffix: string): Promise<void> {
    for (const table of tables) {
      const backupTable = `${table}${backupSuffix}`;
      
      // Check if backup exists
      const result = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = $1
      `, [backupTable]);
      
      if (result.rows.length > 0) {
        await pool.query(`BEGIN`);
        try {
          await pool.query(`TRUNCATE ${table}`);
          await pool.query(`INSERT INTO ${table} SELECT * FROM ${backupTable}`);
          await pool.query(`COMMIT`);
          Logger.info(`Restored ${table} from backup`);
        } catch (error) {
          await pool.query(`ROLLBACK`);
          throw error;
        }
      }
    }
  }

  /**
   * Clean up old backup tables
   */
  static async cleanupBackups(pool: Pool, olderThanDays = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTimestamp = cutoffDate.toISOString().replace(/[^0-9]/g, '').substring(0, 14);
    
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name LIKE '%_backup_%'
      AND table_schema = 'public'
    `);
    
    for (const row of result.rows) {
      const tableName = row.table_name;
      const timestampMatch = tableName.match(/_backup_(\d{14})/);
      
      if (timestampMatch && timestampMatch[1] < cutoffTimestamp) {
        await pool.query(`DROP TABLE IF EXISTS ${tableName}`);
        Logger.info(`Cleaned up old backup table: ${tableName}`);
      }
    }
  }
}

// ============================================================================
// PHOENIX SAMPLE MIGRATIONS
// ============================================================================

export const SAMPLE_MIGRATIONS = {
  optimizeIndexes: {
    version: '20241201_001_optimize_core_indexes',
    name: 'Optimize Core Database Indexes',
    description: 'Add high-performance indexes for dashboard, tasks, and calendar operations',
    up: [
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phoenix_auth_ultra_fast 
       ON users USING btree(clerk_id) 
       INCLUDE (id, email, first_name, last_name, image_url, settings, onboarding_completed)
       WHERE deleted_at IS NULL;`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_phoenix_dashboard_ultra 
       ON blocks(workspace_id, status, type, priority NULLS LAST, due_date NULLS LAST) 
       INCLUDE (id, title, description, progress, updated_at, assigned_to, tags)
       WHERE is_deleted = false AND is_archived = false;`,
      
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_phoenix_calendar_ultra_fast 
       ON events(calendar_id, start_time, end_time) 
       INCLUDE (id, title, type, status, color, is_all_day, description, attendees)
       WHERE deleted_at IS NULL;`,
    ],
    down: [
      'DROP INDEX IF EXISTS idx_users_phoenix_auth_ultra_fast;',
      'DROP INDEX IF EXISTS idx_blocks_phoenix_dashboard_ultra;',
      'DROP INDEX IF EXISTS idx_events_phoenix_calendar_ultra_fast;',
    ],
    estimatedDuration: 300, // 5 minutes
    criticalityLevel: 'high' as const,
    canRunInProduction: true,
    requiresDowntime: false,
    affectedTables: ['users', 'blocks', 'events'],
    backupRequired: false,
  },

  createMaterializedViews: {
    version: '20241201_002_create_materialized_views',
    name: 'Create Materialized Views for Analytics',
    description: 'Create materialized views for ultra-fast dashboard and analytics queries',
    up: [
      // The full materialized view creation from our optimization script
      `-- User dashboard materialized view will be created here`,
      `-- Workspace analytics materialized view will be created here`,
    ],
    down: [
      'DROP MATERIALIZED VIEW IF EXISTS mv_phoenix_user_dashboard CASCADE;',
      'DROP MATERIALIZED VIEW IF EXISTS mv_phoenix_workspace_analytics CASCADE;',
    ],
    estimatedDuration: 120, // 2 minutes
    criticalityLevel: 'medium' as const,
    canRunInProduction: true,
    requiresDowntime: false,
    affectedTables: ['users', 'blocks', 'events', 'workspaces'],
    backupRequired: false,
  },
};

export default PhoenixMigrationManager;