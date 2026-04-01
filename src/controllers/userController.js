const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, email, phone, address } = req.body;
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    
    if (req.file) {
      if (user.profileImage && user.profileImage !== '/uploads/profiles/default-profile.jpg') {
        const oldImagePath = path.join(__dirname, '../../', user.profileImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }
    
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profileImage: updatedUser.profileImage,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.profileImage && user.profileImage !== '/uploads/profiles/default-profile.jpg') {
      const imagePath = path.join(__dirname, '../../', user.profileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    res.json({ totalUsers, totalCustomers, totalAdmins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an image' });
    const user = await User.findById(req.user._id);
    
    if (user.profileImage && user.profileImage !== '/uploads/profiles/default-profile.jpg') {
      const oldImagePath = path.join(__dirname, '../../', user.profileImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    
    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();
    res.json({ message: 'Profile image uploaded', profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, getDashboardStats, uploadProfileImage };