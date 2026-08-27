const formLogin =
    document.getElementById("form-login");

const pesanLogin =
    document.getElementById("pesan-login");


formLogin.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const username =
            document.getElementById(
                "username"
            ).value;

        const password =
            document.getElementById(
                "password"
            ).value;


        try {

            const response =
                await fetch("/login", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })

                });


            const hasil =
                await response.json();


            if (!response.ok) {

                pesanLogin.textContent =
                    hasil.pesan;

                return;
            }


            window.location.href =
                "/admin.html";


        } catch (error) {

            console.error(error);

            pesanLogin.textContent =
                "Gagal terhubung ke server.";
        }

    }
);