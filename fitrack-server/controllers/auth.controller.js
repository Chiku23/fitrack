import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { email, password, base_currency, timezone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Required validation inputs missing.' });
    }

    const accountExists = await User.findOne({ where: { email } });
    if (accountExists) {
      return res.status(400).json({ success: false, error: 'Identity designation resource already allocated.' });
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
    return res.status(500).json({ success: false, error: 'Internal system fault: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Required validation inputs missing.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication criteria confirmation failure.' });
    }

    if (user.status === 'locked' || user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Account access has been administratively restricted.' });
    }

    const credentialIsValid = await bcrypt.compare(password, user.password);
    if (!credentialIsValid) {
      return res.status(401).json({ success: false, error: 'Authentication criteria confirmation failure.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal system fault: ' + error.message });
  }
};