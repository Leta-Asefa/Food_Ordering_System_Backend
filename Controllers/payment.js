const Payment = require('../Models/Payment');
const Promotion = require('../Models/Promotion')
const { Chapa } = require('chapa-nodejs');
const chapa = new Chapa({
  secretKey: "CHASECK_TEST-yupCbRiOJ1FcfUGReVpFioCC3YZiLYXp"
});


// Create a new payment
const createPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, paymentMethod, restaurantId } = req.body;

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
      return res.json({ message: 'Restaurant ID is required' });
    }

    const payments = await Payment.find({ restaurantId })
      .populate({
        path: 'orderId',
        populate: {
          path: 'items.item',
          select: 'name price',
        },
      })
      .populate('userId', '-password')
      .populate('orderId.shippingAddress', 'address city')
      .sort({ createdAt: -1 });


    if (!payments.length) {
      return res.json({ message: 'No payments found for this restaurant' });
    }

    res.status(200).json(payments);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
};


const getPaymentsByDateRange = async (req, res) => {
  const { startDate, endDate, restaurantId } = req.params;
  try {
    const payments = await Payment.find({
      restaurantId,
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).populate({
      path: 'orderId',
      populate: {
        path: 'items.item',
        select: 'name price',
      },
    })
      .populate('userId', '-password')
      .populate('orderId.shippingAddress', 'address city')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error fetching payments', error });
  }
};



const getPaymentPage = async (req, res) => {
  const { phoneNumber, amount, firstName, promotionId } = req.body
  const response = await generateTransactionReference(phoneNumber, amount, firstName, promotionId)
  if (response.status === 'success') {
    res.status(201).json({ checkout_url: response.data.checkout_url });
  } else {
    res.status(400).json({ error: "make sure that you entered all the required fields " });
  }

};



const generateTransactionReference = async (phoneNumber, amount, firstName, promotionId) => {
  const tx_ref = await chapa.genTxRef();
  const response = await chapa.initialize({
    phone_number: phoneNumber,
    first_name: firstName,
    amount: amount,
    currency: 'ETB',
    tx_ref: tx_ref,
    callback_url: 'http://localhost:3000/',

  });
  console.log(response)
  
  if (response.status === 'success') {
    const promotion = await Promotion.findById(promotionId)
    console.log(promotion)
    promotion.tx_ref = tx_ref
    await promotion.save()
  }
  return response


}

const verify = async (tx_ref) => {
  console.log(tx_ref)
  const response = await chapa.verify({ tx_ref });
  response.data.status === 'success' ? true : false

}



module.exports = {
  createPayment,
  getPaymentById,
  getAllPaymentsByUser,
  updatePaymentStatus,
  getAllPaymentsByRestaurant,
  getPaymentsByDateRange,
  getPaymentPage,
  verify
};
