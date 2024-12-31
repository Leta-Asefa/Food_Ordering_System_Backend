const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or another service like 'outlook' or 'sendgrid'
  auth: {
    user: 'letaassefa7@gmail.com',  // replace with your email
    pass: 'ynud fcqr uuar kecv',   // replace with your email password or app password
  },
});

// Send Email Function
const sendApprovalEmail = (customerEmail, restaurantName) => {
  const mailOptions = {
    from: 'your-email@gmail.com',  // sender address
    to: customerEmail,             // recipient address
    subject: 'Your Restaurant Approval Status',  // Subject line
    text: `Congratulations! Your restaurant ${restaurantName} has been approved.`,  // plain text body
    html: `
    <div> 
    <h1> <b> Congratulations </b> </h1>
    <p> Your restaurant <strong>${restaurantName}</strong> has been approved.</p>
    <h5> Leta Asef (system super admin) </h5>
    </div>`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = sendApprovalEmail;
