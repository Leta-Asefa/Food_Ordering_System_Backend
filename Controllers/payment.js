const Payment = require('../Models/Payment');

// Create a new payment
const createPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, paymentMethod,restaurantId } = req.body;

    if (!orderId || !userId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const payment = new Payment({
      orderId,
      userId,
      restaurantId,
      paymentMethod,
      amount
    });

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('orderId userId restaurantId');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all payments for a user
const getAllPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ userId }).populate('orderId');

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    const updatedPayment = await payment.save();

    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getAllPaymentsByRestaurant = async (req, res) => {
    try {
      const { restaurantId } = req.params;
  
      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID is required' });
      }
  
      const payments = await Payment.find({ restaurantId })
        .populate('orderId userId')
        .sort({ createdAt: -1 }); // Sort by latest payments first
  
      if (!payments.length) {
        return res.status(404).json({ message: 'No payments found for this restaurant' });
      }
  
      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

module.exports = {
  createPayment,
  getPaymentById,
  getAllPaymentsByUser,
  updatePaymentStatus,
  getAllPaymentsByRestaurant
};
