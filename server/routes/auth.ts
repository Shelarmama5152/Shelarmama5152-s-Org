import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { executeGet, executeRun, executeQuery } from '../db.ts';

export const authRouter = Router();

// Middleware to extract simple session token
export async function authenticateUser(req: Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!token) return null;

  try {
    // Token format: base64 encoded user_id:email:timestamp
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userIdStr, email] = decoded.split(':');
    const userId = parseInt(userIdStr, 10);
    if (!userId || !email) return null;

    const user = await executeGet('SELECT User_ID, Name, Email, Phone, Role, Created_At FROM User WHERE User_ID = ? AND Email = ?;', [userId, email]);
    return user;
  } catch {
    return null;
  }
}

// Register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role = 'Passenger' } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    // Check duplicate email
    const existing = await executeGet('SELECT User_ID FROM User WHERE LOWER(Email) = LOWER(?);', [email.trim()]);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please login instead.' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const assignedRole = role === 'Admin' ? 'Admin' : 'Passenger';

    const result = await executeRun(
      'INSERT INTO User (Name, Email, Phone, Password, Role) VALUES (?, ?, ?, ?, ?);',
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, hashedPassword, assignedRole]
    );

    const newUser = await executeGet(
      'SELECT User_ID, Name, Email, Phone, Role, Created_At FROM User WHERE User_ID = ?;',
      [result.lastInsertId]
    );

    if (!newUser) {
      res.status(500).json({ error: 'Failed to retrieve registered user profile.' });
      return;
    }

    const token = Buffer.from(`${newUser.User_ID}:${newUser.Email}:${Date.now()}`).toString('base64');

    res.status(201).json({
      message: 'Account registered successfully.',
      user: newUser,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete user registration.' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await executeGet(
      'SELECT User_ID, Name, Email, Phone, Password, Role, Created_At FROM User WHERE LOWER(Email) = LOWER(?);',
      [email.trim()]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.Password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = Buffer.from(`${user.User_ID}:${user.Email}:${Date.now()}`).toString('base64');
    const { Password, ...userProfile } = user;

    res.json({
      message: 'Login successful.',
      user: userProfile,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to process login.' });
  }
});

// Current User Profile
authRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Logout
authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully.' });
});
