import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AdminCounters, AdminSettings, UserFilter } from '@option-dashboard/shared';
import { db } from '../db/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require superadmin role
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

/**
 * GET /admin/counters
 * Get dashboard counters
 */
router.get('/counters', async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.getUsers();
    const payments = await db.getPayments();
    const settings = await db.getSettings();

    const freeUsers = users.filter(u => u.status === 'free').length;
    const paidUsers = users.filter(u => u.status === 'paid').length;
    const expiredUsers = users.filter(u => u.status === 'expired').length;

    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const counters: AdminCounters = {
      totalUsers: users.length,
      freeUsers,
      paidUsers,
      expiredUsers,
      totalRevenue,
      taxPercent: settings.taxPercent,
    };

    res.json(counters);
  } catch (error) {
    console.error('Error fetching counters:', error);
    res.status(500).json({ error: 'Failed to fetch counters' });
  }
});

/**
 * GET /admin/settings
 * Get admin settings
 */
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /admin/settings
 * Update admin settings
 */
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = req.body as AdminSettings;
    await db.saveSettings(settings);

    // Log the action
    await db.createLog({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      adminId: req.user!.userId,
      action: 'update_settings',
      details: settings,
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /admin/users
 * Get users list with optional filtering
 */
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { query, status } = req.query;
    let users = await db.getUsers();

    // Filter by status
    if (status && status !== 'all') {
      users = users.filter(u => u.status === status);
    }

    // Search by name or email
    if (query && typeof query === 'string') {
      const searchLower = query.toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.mobile?.includes(searchLower)
      );
    }

    // Remove password hash from response
    const sanitizedUsers = users.map(({ password_hash, ...user }) => user);

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PUT /admin/users/:id
 * Update user details (role, status, plan)
 */
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await db.updateUser(id, updates);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Log the action
    await db.createLog({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      adminId: req.user!.userId,
      action: 'update_user',
      details: { userId: id, updates },
    });

    // Remove password hash from response
    const { password_hash, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /admin/users/:id/devices
 * Clear all devices for a user
 */
router.delete('/users/:id/devices', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db.getUserById(id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Clear all devices
    await db.updateUser(id, { devices: [] });

    // Log the action
    await db.createLog({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      adminId: req.user!.userId,
      action: 'clear_devices',
      details: { userId: id, email: user.email },
    });

    res.json({ message: 'All devices cleared successfully' });
  } catch (error) {
    console.error('Error clearing devices:', error);
    res.status(500).json({ error: 'Failed to clear devices' });
  }
});

/**
 * GET /admin/logs
 * Get recent admin logs
 */
router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await db.getLogs();
    
    // Return most recent logs
    const recentLogs = logs.slice(-Number(limit)).reverse();
    res.json(recentLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
