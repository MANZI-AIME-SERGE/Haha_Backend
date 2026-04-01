const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const { getUsers, getUserById, updateUser, deleteUser, getDashboardStats, uploadProfileImage } = require('../controllers/userController');

const router = express.Router();

router.route('/').get(protect, admin, getUsers);
router.get('/dashboard/stats', protect, admin, getDashboardStats);
router.post('/upload-profile-image', protect, upload.single('image'), uploadProfileImage);
router.route('/:id').get(protect, admin, getUserById).put(protect, upload.single('image'), updateUser).delete(protect, admin, deleteUser);

module.exports = router;