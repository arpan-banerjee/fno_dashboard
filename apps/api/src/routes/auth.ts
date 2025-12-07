import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterRequest, LoginRequest, User, AuthResponse } from '@option-dashboard/shared';
import { db } from '../db/database';
import { generateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/register
 * Register a new user with free trial
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, mobile, password } = req.body as RegisterRequest;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Calculate free trial period
    const settings = await db.getSettings();
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + settings.freeTrialDays);

    // Create user
    const user: User = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      mobile,
      password_hash,
      role: 'user',
      plans: [
        {
          type: 'free',
          start: now.toISOString(),
          end: trialEnd.toISOString(),
        },
      ],
      devices: [],
      status: 'free',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    await db.createUser(user);

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Login with email/password and device fingerprint
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, device_fingerprint } = req.body as LoginRequest;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if account is expired
    const now = new Date();
    const lastPlan = user.plans[user.plans.length - 1];
    const planEnd = new Date(lastPlan.end);
    
    if (planEnd < now && user.status === 'expired') {
      res.status(403).json({ 
        error: 'Account expired', 
        requiresPlan: true,
        redirectTo: '/paid-plan' 
      });
      return;
    }

    // Handle device management
    if (device_fingerprint) {
      const deviceExists = user.devices.some(d => d.device_id === device_fingerprint);
      
      if (!deviceExists) {
        // Check device limit (superadmin and admin have unlimited devices)
        if (user.role !== 'superadmin' && user.role !== 'admin') {
          const deviceLimit = user.status === 'paid' ? 2 : 1;
          
          if (user.devices.length >= deviceLimit) {
            res.status(403).json({ 
              error: 'Device limit exceeded', 
              requiresSmsVerification: true 
            });
            return;
          }
        }

        // Add new device
        user.devices.push({
          device_id: device_fingerprint,
          added_at: new Date().toISOString(),
        });
        await db.updateUser(user.id, { devices: user.devices });
      }
    }

    // Update status if plan is still valid
    if (planEnd >= now && user.status === 'expired') {
      const status = lastPlan.type === 'free' ? 'free' : 'paid';
      await db.updateUser(user.id, { status });
      user.status = status;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      device_id: device_fingerprint,
    });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /auth/logout
 * Logout (client-side token removal, server can blacklist if needed)
 */
router.post('/logout', (req: Request, res: Response) => {
  // In stateless JWT, logout is handled client-side
  // Could implement token blacklist here if needed
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /auth/verify-sms
 * Stub for SMS verification (always succeeds in dev)
 */
router.post('/verify-sms', async (req: Request, res: Response) => {
  const { code, email } = req.body;
  
  // In development, any code is valid
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_MODE === 'true') {
    res.json({ success: true, message: 'SMS verified (dev mode)' });
    return;
  }
  
  // In production, implement actual SMS verification
  // For now, just check if code is "123456"
  if (code === '123456') {
    res.json({ success: true, message: 'SMS verified' });
  } else {
    res.status(400).json({ error: 'Invalid verification code' });
  }
});

export default router;
