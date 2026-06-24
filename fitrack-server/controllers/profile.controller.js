import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

// @desc   Get current user profile
// @route  GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Update user profile
// @route  PUT /api/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const { display_name, base_currency, timezone } = req.body;
    await user.update({ display_name, base_currency, timezone });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Change password
// @route  PUT /api/profile/password
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Please provide current and new password.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // Get raw user with password
    const rawUser = await User.findOne({ where: { id: req.user.id }, attributes: { include: ['password'] } });
    const isValid = await bcrypt.compare(current_password, rawUser.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashed, password_changed_at: new Date() });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};
