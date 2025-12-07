import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, AdminSettings } from '@option-dashboard/shared';
import { db } from './database';

/**
 * Initialize database with default settings and seed superadmin user
 */
export async function initializeDatabase(): Promise<void> {
  await db.ensureStorageDir();

  // Initialize settings
  let settings = await db.getSettings();
  if (!settings || Object.keys(settings).length === 0) {
    settings = {
      freeTrialDays: parseInt(process.env.FREE_TRIAL_DAYS || '30'),
      planRates: {
        paid_90: 999,
        paid_180: 1799,
        paid_365: 2999,
      },
      paymentLink: 'https://payment.example.com',
      qrImageUrl: '/images/payment-qr.png',
      taxPercent: parseInt(process.env.TAX_PERCENT || '18'),
      oiChangeThreshold: 60,
      oiSpurtThreshold: 9.5,
    };
    await db.saveSettings(settings);
    console.log('✓ Default settings created');
  }

  // Seed superadmin user
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'primexa1967@gmail.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'ChangeMe!123';
  
  const existingAdmin = await db.getUserByEmail(adminEmail);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const now = new Date().toISOString();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 365); // Give superadmin 1 year

    const superadmin: User = {
      id: uuidv4(),
      name: 'Primexa Admin',
      email: adminEmail,
      mobile: '9836001579',
      password_hash: passwordHash,
      role: 'superadmin',
      plans: [
        {
          type: 'paid_365',
          start: now,
          end: trialEndDate.toISOString(),
        },
      ],
      devices: [],
      status: 'paid',
      created_at: now,
      updated_at: now,
    };

    await db.createUser(superadmin);
    console.log(`✓ Superadmin user created: ${adminEmail}`);
  } else {
    console.log('✓ Superadmin user already exists');
  }

  // Initialize empty payments and logs if needed
  const payments = await db.getPayments();
  if (payments.length === 0) {
    await db.savePayments([]);
  }

  const logs = await db.getLogs();
  if (logs.length === 0) {
    await db.saveLogs([]);
  }
}
