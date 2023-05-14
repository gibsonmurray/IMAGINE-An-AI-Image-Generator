const form = document.querySelector("form");
const imagineBtn = document.querySelector("#imagine-btn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (e.submitter === imagineBtn) {
        showSpinner();
        const data = new FormData(form);

        const response = await fetch("/imagine", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: data.get("prompt"),
            }),
        });

        if (response.ok) {
            const { image } = await response.json();

            const result = document.querySelector("#result");
            result.innerHTML = `<img src="${image}" width="512" />`;
        } else {
            const err = await response.text();
            alert(err);
            console.error(err);
        }

        hideSpinner();
    } else {
        const response = await fetch("/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        if (data.redirect) {
            window.location.href = data.redirect;
        }
        else {
            console.error("redirect error");
        }
    }
});

function showSpinner() {
    console.log("loading");
    const button = document.querySelector("#imagine-btn");
    button.disabled = true;
    button.innerHTML = 'Imagining... <span class="spinner">🧠</span>';
}

function hideSpinner() {
    console.log("done");
    const button = document.querySelector("#imagine-btn");
    button.disabled = false;
    button.innerHTML = "Imagine";
}
