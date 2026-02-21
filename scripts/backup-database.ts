import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface BackupOptions {
  outputDir?: string;
  compress?: boolean;
  includeSchema?: boolean;
  includeData?: boolean;
}

class DatabaseBackup {
  private readonly backupDir: string;
  private readonly dbUrl: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    this.dbUrl = process.env.DATABASE_URL || '';

    if (!this.dbUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Parse PostgreSQL connection URL
   */
  private parseDbUrl(): {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
  } {
    const url = new URL(this.dbUrl);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
    };
  }

  /**
   * Create database backup
   */
  async backup(options: BackupOptions = {}): Promise<string> {
    const {
      outputDir = this.backupDir,
      compress = true,
      includeSchema = true,
      includeData = true,
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql${compress ? '.gz' : ''}`;
    const outputPath = path.join(outputDir, filename);

    const dbConfig = this.parseDbUrl();

    console.log('🔄 Starting database backup...');
    console.log(`📦 Output: ${outputPath}`);

    try {
      // Build pg_dump command
      let command = 'pg_dump';

      // Connection parameters
      command += ` -h ${dbConfig.host}`;
      command += ` -p ${dbConfig.port}`;
      command += ` -U ${dbConfig.username}`;
      command += ` -d ${dbConfig.database}`;

      // Options
      if (!includeSchema && !includeData) {
        throw new Error('At least one of includeSchema or includeData must be true');
      }

      if (!includeSchema) {
        command += ' --data-only';
      } else if (!includeData) {
        command += ' --schema-only';
      }

      // Always use clean and create options for full backup
      if (includeSchema && includeData) {
        command += ' --clean --create';
      }

      // Format
      command += ' --format=plain';

      // Compression
      if (compress) {
        command += ` | gzip > "${outputPath}"`;
      } else {
        command += ` > "${outputPath}"`;
      }

      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      await execAsync(command, { env, maxBuffer: 1024 * 1024 * 100 }); // 100MB buffer

      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log('✅ Backup completed successfully!');
      console.log(`📊 Size: ${sizeMB} MB`);
      console.log(`📁 Location: ${outputPath}`);

      // Cleanup old backups (keep last 7 days)
      await this.cleanupOldBackups(7);

      return outputPath;
    } catch (error: any) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<
    Array<{ filename: string; path: string; size: number; date: Date }>
  > {
    const files = fs.readdirSync(this.backupDir);
    const backups = files
      .filter(
        (file) => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))
      )
      .map((file) => {
        const fullPath = path.join(this.backupDir, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          path: fullPath,
          size: stats.size,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return backups;
  }

  /**
   * Delete backups older than specified days
   */
  async cleanupOldBackups(daysToKeep: number = 7): Promise<number> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.date < cutoffDate) {
        fs.unlinkSync(backup.path);
        console.log(`🗑️  Deleted old backup: ${backup.filename}`);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
    }

    return deletedCount;
  }

  /**
   * Create backup with rotation (daily, weekly, monthly)
   */
  async backupWithRotation(): Promise<void> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    // Daily backup (keep 7 days)
    const dailyDir = path.join(this.backupDir, 'daily');
    await this.backup({ outputDir: dailyDir });

    // Weekly backup on Sunday (keep 4 weeks)
    if (dayOfWeek === 0) {
      const weeklyDir = path.join(this.backupDir, 'weekly');
      if (!fs.existsSync(weeklyDir)) {
        fs.mkdirSync(weeklyDir, { recursive: true });
      }
      await this.backup({ outputDir: weeklyDir });
    }

    // Monthly backup on the 1st (keep 12 months)
    if (dayOfMonth === 1) {
      const monthlyDir = path.join(this.backupDir, 'monthly');
      if (!fs.existsSync(monthlyDir)) {
        fs.mkdirSync(monthlyDir, { recursive: true });
      }
      await this.backup({ outputDir: monthlyDir });
    }
  }
}

// CLI execution
async function main() {
  try {
    const backup = new DatabaseBackup();

    const args = process.argv.slice(2);
    const command = args[0] || 'backup';

    switch (command) {
      case 'backup':
        await backup.backup();
        break;

      case 'rotation':
        await backup.backupWithRotation();
        break;

      case 'list':
        const backups = await backup.listBackups();
        console.log('\n📋 Available backups:');
        backups.forEach((b, i) => {
          const sizeMB = (b.size / (1024 * 1024)).toFixed(2);
          console.log(`${i + 1}. ${b.filename} - ${sizeMB} MB - ${b.date.toLocaleString()}`);
        });
        break;

      case 'cleanup':
        const days = parseInt(args[1]) || 7;
        await backup.cleanupOldBackups(days);
        break;

      default:
        console.log('Usage:');
        console.log('  npm run db:backup          - Create a backup');
        console.log('  npm run db:backup rotation - Create backup with rotation');
        console.log('  npm run db:backup list     - List all backups');
        console.log(
          '  npm run db:backup cleanup [days] - Delete backups older than [days] (default: 7)'
        );
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default DatabaseBackup;
