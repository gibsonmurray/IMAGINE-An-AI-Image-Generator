const passwordInput = document.getElementById("password");
const togglePasswordButton = document.getElementById("toggle-password");
const eye = document.getElementById("eye");

togglePasswordButton.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eye.src = "./assets/eye-hide.svg";
    } else {
        passwordInput.type = "password";
        eye.src = "./assets/eye-show.svg";
    }
});

const form = document.querySelector("form");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("login");
    let response = undefined;

    if (e.submitter === loginBtn) {
        showSpinner("Verifying Credentials...");
        response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
    } else {
        showSpinner("Creating User...");
        response = await fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
    }

    const data = await response.json();
    hideSpinner();

    const msgBox = document.querySelector("#messages");
    msgBox.innerHTML = `<p>${data.message}</p>`;
    if (data.redirect) {
        // Redirect to the new page
        window.location.href = data.redirect;
    }
});

function showSpinner(msg) {
    const msgBox = document.querySelector("#messages");
    const loginBtn = document.getElementById("login");
    const signUpBtn = document.getElementById("signup");
    msgBox.innerHTML = `<p>${msg} <span class="spinner">🧠</span></p>`;
    loginBtn.disabled = true;
    signUpBtn.disabled = true;
}

function hideSpinner() {
    const msgBox = document.querySelector("#messages");
    const loginBtn = document.getElementById("login");
    const signUpBtn = document.getElementById("signup");
    msgBox.innerHTML = "";
    loginBtn.disabled = false;
    signUpBtn.disabled = false;
}
