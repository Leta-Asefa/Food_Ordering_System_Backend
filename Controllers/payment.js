const Payment = require('../Models/Payment');
const Promotion = require('../Models/Promotion')
const { chapa } = require('../Chapa/chapa');
const Order = require('../Models/Order');
const { activatePromotion } = require('./promotion');
const { socket_users, io } = require('../socket/socket');
const crypto = require('crypto')



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



const getPromotionPaymentPage = async (req, res) => {
  const { phoneNumber, amount, firstName, promotionId } = req.body
  const response = await generateTransactionReference(phoneNumber, amount, firstName, promotionId)
  if (response.status === 'success') {
    res.status(201).json({ checkout_url: response.data.checkout_url });
  } else {
    res.status(400).json({ error: "make sure that you entered all the required fields " });
  }

};


const getOrderPaymentPage = async (req, res) => {
  const { phoneNumber, amount, firstName, subAccountId, orderId, userId } = req.body

  console.log(orderId, userId)
  const order = await Order.findById(orderId)
  if (!order) return res.json({ error: 'No order is found !' })

  if (!order.checkout_url) {


    const tx_ref = await chapa.genTxRef();
    const response = await chapa.initialize({
      phone_number: phoneNumber,
      first_name: firstName,
      amount: amount,
      currency: 'ETB',
      tx_ref: tx_ref,
      callback_url: 'http://localhost:3000/',
      split: {
        subaccounts: [{ id: subAccountId }]
      },
      meta: {
        type: "order",
        orderId,
        userId
      }

    });

    if (response.status === 'success') {
      order.checkout_url = response.data.checkout_url
      await order.save()
      res.status(201).json({ checkout_url: response.data.checkout_url });
    }
    else {
      res.status(201).json({ checkout_url: order.checkout_url });
    }

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

  if (response.status === 'success') {
    const promotion = await Promotion.findById(promotionId)
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

const chapaWebhook = async (req, res) => {
  
  console.log("Web hook is called")
  const {orderId,userId,type}=req.body.meta

  const hash = crypto.createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  
  if (hash == req.headers['x-chapa-signature']) { // we know it is from the right source
    
    if (type === 'order' && req.body.status === 'success') {
      const order = await Order.findById(orderId)
      if(order.status==='Processing') return // as chapa my send the same webhook request multiple times
      order.tx_ref = req.body.tx_ref
      order.status = 'Processing'
      await order.save()

      const userSocketId = socket_users[userId]?.socketId
      if (userSocketId)
        io.to(userSocketId).emit('order_status_update', { message: "Dear Customer, Your order "+orderId+ " is being processed. It will be on transit soon. Thank you for your patience !" })
      console.log("io sent")
      return
    }
    else {
      activatePromotion(req, res)
      return
    }


  }


};



module.exports = {
  createPayment,
  getPaymentById,
  getAllPaymentsByUser,
  updatePaymentStatus,
  getAllPaymentsByRestaurant,
  getPaymentsByDateRange,
  verify,
  getOrderPaymentPage,
  getPromotionPaymentPage,
  chapaWebhook
};
