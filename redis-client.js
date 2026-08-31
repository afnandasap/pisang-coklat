const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});

redisClient.on("error", function(err) {
    console.error("Redis Client Error:", err);
});

redisClient.connect()
    .then(function() {
        console.log("Redis berhasil terhubung!");
    })
    .catch(function(err) {
        console.error("Redis gagal terhubung:", err);
    });

module.exports = redisClient;