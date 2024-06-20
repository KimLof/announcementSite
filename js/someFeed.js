document.addEventListener("DOMContentLoaded", function () {
    if (!localStorage.getItem("jwtToken")) {
        // Jos tokenia ei ole, ohjataan käyttäjä kirjautumissivulle
        window.location.href = "/";
    } else {
        let userId = ""; // Tähän tulee kirjautuneen käyttäjän id

        const token = localStorage.getItem("jwtToken"); // Hakee tokenin selaimen Local Storagesta
        // Hae kirjautuneen käyttäjän tiedot
        fetch("/api/user", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    console.log("Token not valid");
                    window.location.href = "/"; // Siirry kirjautumissivulle, jos token on väärä tai vanhentunut
                }
                return response.json();
            })
            .then((userProfile) => {
                userId = userProfile.id; // Aseta userId-muuttujaan kirjautuneen käyttäjän id
                document.querySelector("#user-username").textContent =
                    userProfile.username;
            })
            .catch((error) => {
                console.error("Error:", error);
                window.location.href = "/"; // Siirry kirjautumissivulle, jos token on väärä tai vanhentunut
            });

        }
});
