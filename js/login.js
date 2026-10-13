document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault();
    login();
});

function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch(
        API_BASE_URL +
        "/auth/login?username=" +
        encodeURIComponent(username) +
        "&password=" +
        encodeURIComponent(password),
        {
            method: "POST"
        }
    )
    .then(response => {

        if (!response.ok) {
            throw new Error("Login failed");
        }

        return response.text();
    })
    .then(token => {

        localStorage.setItem("token", token);

        console.log("Login successful");

        window.location.href = "dashboard.html";
    })
    .catch(error => {

        console.error(error);

        document.getElementById("loginError").textContent =
            "Invalid username or password";
    });
}