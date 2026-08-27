require("dotenv").config();

const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on(
    "error",
    function(error) {

        console.error(
            "Redis error:",
            error.message
        );
    }
);

module.exports = redisClient;