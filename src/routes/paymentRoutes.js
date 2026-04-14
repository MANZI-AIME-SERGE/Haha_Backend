const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  initiatePayment,
  verifyPayment,
  getPaymentByOrder,
  getCustomerPayments,
  getAllPayments,
  refundPayment
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.get('/verify/:transactionId', verifyPayment);
router.get('/order/:orderId', protect, getPaymentByOrder);
router.get('/my-payments', protect, getCustomerPayments);
router.get('/all', protect, admin, getAllPayments);
router.put('/:id/refund', protect, admin, refundPayment);

module.exports = router;
