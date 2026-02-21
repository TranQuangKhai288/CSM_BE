import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

class DatabaseRestore {
  private readonly dbUrl: string;

  constructor() {
    this.dbUrl = process.env.DATABASE_URL || '';

    if (!this.dbUrl) {
      throw new Error('DATABASE_URL is not defined');
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
   * Verify backup file exists and is readable
   */
  private verifyBackupFile(backupPath: string): void {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const stats = fs.statSync(backupPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${backupPath}`);
    }

    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Backup file: ${backupPath}`);
    console.log(`📊 Size: ${sizeMB} MB`);
  }

  /**
   * Prompt for user confirmation
   */
  private async confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${message} (yes/no): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  /**
   * Restore database from backup file
   */
  async restore(
    backupPath: string,
    options: { force?: boolean; dropExisting?: boolean } = {}
  ): Promise<void> {
    const { force = false, dropExisting = true } = options;

    this.verifyBackupFile(backupPath);

    const dbConfig = this.parseDbUrl();
    const isCompressed = backupPath.endsWith('.gz');

    console.log('\n⚠️  WARNING: This will restore the database from backup.');
    console.log('⚠️  All current data will be lost!');
    console.log(`\n🗄️  Database: ${dbConfig.database}`);
    console.log(`📁 Backup: ${backupPath}`);

    // Confirmation
    if (!force) {
      const confirmed = await this.confirm('\nAre you sure you want to proceed?');
      if (!confirmed) {
        console.log('❌ Restore cancelled.');
        return;
      }
    }

    try {
      console.log('\n🔄 Starting database restore...');

      // Drop existing database if requested
      if (dropExisting) {
        console.log('🗑️  Dropping existing database...');
        await this.dropDatabase(dbConfig);
        console.log('✅ Database dropped');

        console.log('🆕 Creating new database...');
        await this.createDatabase(dbConfig);
        console.log('✅ Database created');
      }

      // Build restore command
      let command: string;

      if (isCompressed) {
        command = `gunzip -c "${backupPath}" | psql`;
      } else {
        command = `psql -f "${backupPath}"`;
      }

      // Add connection parameters
      command += ` -h ${dbConfig.host}`;
      command += ` -p ${dbConfig.port}`;
      command += ` -U ${dbConfig.username}`;
      command += ` -d ${dbConfig.database}`;

      // Set password environment variable
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      console.log('📥 Importing data...');
      await execAsync(command, { env, maxBuffer: 1024 * 1024 * 100 }); // 100MB buffer

      console.log('\n✅ Database restore completed successfully!');
      console.log('🎉 Your database has been restored from backup.');
    } catch (error: any) {
      console.error('\n❌ Restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Drop database
   */
  private async dropDatabase(config: ReturnType<typeof this.parseDbUrl>): Promise<void> {
    const command = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d postgres -c "DROP DATABASE IF EXISTS ${config.database};"`;
    const env = { ...process.env, PGPASSWORD: config.password };
    await execAsync(command, { env });
  }

  /**
   * Create database
   */
  private async createDatabase(config: ReturnType<typeof this.parseDbUrl>): Promise<void> {
    const command = `psql -h ${config.host} -p ${config.port} -U ${config.username} -d postgres -c "CREATE DATABASE ${config.database};"`;
    const env = { ...process.env, PGPASSWORD: config.password };
    await execAsync(command, { env });
  }

  /**
   * List available backups
   */
  async listBackups(backupDir: string = path.join(process.cwd(), 'backups')): Promise<void> {
    if (!fs.existsSync(backupDir)) {
      console.log('❌ No backups directory found');
      return;
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(
        (file) => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))
      )
      .map((file) => {
        const fullPath = path.join(backupDir, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          path: fullPath,
          size: stats.size,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (backups.length === 0) {
      console.log('❌ No backup files found');
      return;
    }

    console.log('\n📋 Available backups:\n');
    backups.forEach((backup, i) => {
      const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
      console.log(`${i + 1}. ${backup.filename}`);
      console.log(`   📊 Size: ${sizeMB} MB`);
      console.log(`   📅 Date: ${backup.date.toLocaleString()}`);
      console.log(`   📁 Path: ${backup.path}`);
      console.log('');
    });
  }
}

// CLI execution
async function main() {
  try {
    const restore = new DatabaseRestore();
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'list') {
      await restore.listBackups();
      console.log('\nUsage:');
      console.log('  npm run db:restore <backup-file>  - Restore from backup file');
      console.log('  npm run db:restore list           - List available backups');
      return;
    }

    const backupPath = command;
    const force = args.includes('--force') || args.includes('-f');

    await restore.restore(backupPath, { force });
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default DatabaseRestore;
