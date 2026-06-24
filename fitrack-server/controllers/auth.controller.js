import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { email, password, base_currency, timezone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const accountExists = await User.findOne({ where: { email } });
    if (accountExists) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const saltRounds = 10;
    const generatedSalt = await bcrypt.genSalt(saltRounds);
    const complexHash = await bcrypt.hash(password, generatedSalt);

    const newUser = await User.create({
      email,
      password: complexHash,
      status: 'active',
      base_currency: base_currency || 'USD',
      timezone: timezone || 'UTC'
    });

    return res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.status === 'locked' || user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account access is restricted.' });
    }

    const credentialIsValid = await bcrypt.compare(password, user.password);
    if (!credentialIsValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};