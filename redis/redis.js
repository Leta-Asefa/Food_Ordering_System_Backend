const redis = require("redis");
const chalk = require('chalk')

const redisClient = redis.createClient();
redisClient.connect()
  .then(() => console.log(chalk.magenta.bold('Connected To Redis !')))
  .catch(err => console.error("Redis Connection Error:", err));
module.exports.redisClient = redisClient;
