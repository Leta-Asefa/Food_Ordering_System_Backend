// Just exporting Chapa for payment for our system food ordering system
// Importing Chapa
const { Chapa } = require('chapa-nodejs');
const chapa = new Chapa({
  secretKey: "CHASECK_TEST-yupCbRiOJ1FcfUGReVpFioCC3YZiLYXp"
});
module.exports.chapa = chapa;
