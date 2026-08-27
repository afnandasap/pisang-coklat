const bcrypt = require("bcrypt");

const password = "admin123";

bcrypt.hash(password, 10, function(error, hash) {

    if (error) {
        console.error(error);
        return;
    }

    console.log(hash);
});