const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  uploadProfileImage
} = require('../controllers/userController');

const router = express.Router();

//===========Route For admin===================
router.get('/', protect, admin, getUsers);
router.get('/dashboard/stats', protect, admin, getDashboardStats);
router.delete('/:id', protect, admin, deleteUser);

//==========Protect Routes==============
router.post('/upload-profile-image', protect, upload.single('image'), uploadProfileImage);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, upload.single('image'), updateUser);

module.exports = router;