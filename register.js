// ===== 1. GRAB ELEMENTS =====
const nameInput = document.getElementById("regName");
const emailInput = document.getElementById("regEmail");
const passwordInput = document.getElementById("regPassword");
const confirmInput = document.getElementById("regConfirm");
const termsBox = document.getElementById("terms");
const registerBtn = document.getElementById("registerBtn");
const message = document.getElementById("registerMessage");

// ===== 2. SHOW A MESSAGE =====
function showMessage(text, type) {
    message.textContent = text;
    message.className = "form-message " + type;
}

// ===== 3. CHECK THE FORM =====
function validateForm() {
    if (nameInput.value.trim() === "") return "Please enter your full name.";
    if (emailInput.value.trim() === "") return "Please enter your email address.";
    if (passwordInput.value.length < 8) return "Your password must be at least 8 characters.";
    if (passwordInput.value !== confirmInput.value) return "The two passwords do not match.";
    if (!termsBox.checked) return "Please accept the terms and conditions.";
    return "";
}

// ===== 4. CREATE THE ACCOUNT =====
async function registerStudent() {
    const problem = validateForm();
    if (problem !== "") {
        showMessage(problem, "error");
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    const { error } = await supabaseClient.auth.signUp({
        email: emailInput.value.trim(),
        password: passwordInput.value,
        options: {
            data: { full_name: nameInput.value.trim() },
            emailRedirectTo: window.location.origin + "/login.html"
        }
    });

    registerBtn.disabled = false;
    registerBtn.textContent = "Create Account";

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    showMessage("Account created! Check your email to confirm your address, then log in.", "success");
}

registerBtn.addEventListener("click", registerStudent);