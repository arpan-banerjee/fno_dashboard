import fs from 'fs/promises';
import path from 'path';
import { User, AdminSettings, Payment, AdminLog } from '@option-dashboard/shared';

const STORAGE_DIR = path.join(__dirname, '../../storage');

export interface Database {
  users: User[];
  settings: AdminSettings;
  payments: Payment[];
  logs: AdminLog[];
}

class JSONDatabase {
  private dbPath = {
    users: path.join(STORAGE_DIR, 'users.json'),
    settings: path.join(STORAGE_DIR, 'settings.json'),
    payments: path.join(STORAGE_DIR, 'payments.json'),
    logs: path.join(STORAGE_DIR, 'logs.json'),
  };

  async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(STORAGE_DIR);
    } catch {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
  }

  async read<T>(key: keyof Database): Promise<T> {
    try {
      const data = await fs.readFile(this.dbPath[key], 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return empty array/object if file doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return (key === 'settings' ? {} : []) as T;
      }
      throw error;
    }
  }

  async write<T>(key: keyof Database, data: T): Promise<void> {
    await this.ensureStorageDir();
    await fs.writeFile(this.dbPath[key], JSON.stringify(data, null, 2), 'utf-8');
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return this.read<User[]>('users');
  }

  async saveUsers(users: User[]): Promise<void> {
    await this.write('users', users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(user: User): Promise<User> {
    const users = await this.getUsers();
    users.push(user);
    await this.saveUsers(users);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
    await this.saveUsers(users);
    return users[index];
  }

  // Settings operations
  async getSettings(): Promise<AdminSettings> {
    return this.read<AdminSettings>('settings');
  }

  async saveSettings(settings: AdminSettings): Promise<void> {
    await this.write('settings', settings);
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    return this.read<Payment[]>('payments');
  }

  async savePayments(payments: Payment[]): Promise<void> {
    await this.write('payments', payments);
  }

  async createPayment(payment: Payment): Promise<Payment> {
    const payments = await this.getPayments();
    payments.push(payment);
    await this.savePayments(payments);
    return payment;
  }

  // Log operations
  async getLogs(): Promise<AdminLog[]> {
    return this.read<AdminLog[]>('logs');
  }

  async saveLogs(logs: AdminLog[]): Promise<void> {
    await this.write('logs', logs);
  }

  async createLog(log: AdminLog): Promise<AdminLog> {
    const logs = await this.getLogs();
    logs.push(log);
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    await this.saveLogs(logs);
    return log;
  }
}

export const db = new JSONDatabase();
