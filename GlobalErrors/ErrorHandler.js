const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.isOperational ? err.message : 'Internal Server Error';

    // ✅ Handle specific Mongoose errors
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Mongo : Invalid ${err.path}: ${err.value}.`;
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = `Mongo : Duplicate field value entered: ${Object.keys(err.keyValue).join(', ')}`;
    }

    if (err.name === 'MongoNetworkError') {
        statusCode = 503;
        message = 'Mongo : Database connection error. Please try again later.';
    }

    // ✅ Handle Axios errors
    if (err.isAxiosError) {
        statusCode = err.response ? err.response.status : 500;
        message = err.response ? "Axios "+err.response.data : 'Axios Error in external API request';
    }

    // ✅ Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'JWT : Invalid token. Please log in again.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'JWT : Your token has expired. Please log in again.';
    }

    // ✅ Handle Bcrypt errors
    if (err.message && err.message.includes('data and salt arguments required')) {
        statusCode = 400;
        message = 'Bcrypt : Encryption error. Data or salt is missing.';
    }

    // ✅ Handle Multer (file upload) errors
    // if (err.code === 'LIMIT_FILE_SIZE') {
    //     statusCode = 400;
    //     message = 'Multer : File size is too large.';
    // }

    // if (err.code === 'LIMIT_FILE_TYPE') {
    //     statusCode = 400;
    //     message = 'Multer : Invalid file type. Please upload a valid file.';
    // }

    // ✅ Handle Nodemailer errors
    if (err.name === 'SMTPConnectionError') {
        statusCode = 503;
        message = 'NodeMailer : Email service is unavailable. Please try again later.';
    }

    if (err.name === 'SMTPAuthenticationError') {
        statusCode = 401;
        message = 'NodeMailer : Failed to authenticate with the email service.';
    }

    // ✅ Default error response
    res.status(statusCode).json({
        status: 'error',
        message,
    });

    // Log non-operational errors for debugging
    if (!err.isOperational) {
        console.error('ERROR :', err);
    }
};

module.exports = globalErrorHandler;
