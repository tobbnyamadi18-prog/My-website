// ===== 1. GRAB ELEMENTS =====
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("loginMessage");

// ===== 2. SHOW A MESSAGE =====
function showMessage(text, type) {
    message.textContent = text;
    message.className = "form-message " + type;
}

// ===== 3. LOG IN =====
async function loginStudent() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (email === "" || password === "") {
        showMessage("Please enter your email and password.", "error");
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    window.location.href = "index.html";
}

loginBtn.addEventListener("click", loginStudent);
passwordInput.addEventListener("keydown", event => {
    if (event.key === "Enter") loginStudent();
});