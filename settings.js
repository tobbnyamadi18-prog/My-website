// ===== 1. GRAB ELEMENTS =====
const nameField = document.getElementById("setName");
const emailField = document.getElementById("setEmail");
const programField = document.getElementById("setProgram");
const levelField = document.getElementById("setLevel");
const saveBtn = document.getElementById("saveSettingsBtn");
const settingsMessage = document.getElementById("settingsMessage");

const prefBoxes = {
    notify_assignments: document.getElementById("prefAssignments"),
    notify_quizzes: document.getElementById("prefQuizzes"),
    notify_lectures: document.getElementById("prefLectures"),
    notify_email: document.getElementById("prefEmail")
};

const DEFAULT_PREFS = {
    notify_assignments: true,
    notify_quizzes: true,
    notify_lectures: true,
    notify_email: false
};

// ===== 2. SHOW A MESSAGE =====
function showSettingsMessage(text, type) {
    settingsMessage.textContent = text;
    settingsMessage.className = "form-message " + type;
}

// ===== 3. LOAD THE SAVED SETTINGS =====
async function loadSettings() {
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) return;

    const user = data.session.user;
    const meta = user.user_metadata;

    nameField.value = meta.full_name || "";
    emailField.value = user.email;
    programField.value = meta.programme || "";
    if (meta.level) levelField.value = meta.level;

    for (const key in prefBoxes) {
        prefBoxes[key].checked = meta[key] !== undefined ? meta[key] : DEFAULT_PREFS[key];
    }
}

// ===== 4. SAVE THE SETTINGS =====
async function saveSettings() {
    const fullName = nameField.value.trim();
    if (fullName === "") {
        showSettingsMessage("Please enter your full name.", "error");
        return;
    }

    const updates = {
        full_name: fullName,
        programme: programField.value.trim(),
        level: levelField.value
    };
    for (const key in prefBoxes) {
        updates[key] = prefBoxes[key].checked;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const { error } = await supabaseClient.auth.updateUser({ data: updates });

    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";

    if (error) {
        showSettingsMessage(error.message, "error");
        return;
    }

    document.getElementById("profileName").textContent = fullName;
    document.getElementById("avatar").textContent = fullName.charAt(0).toUpperCase();
    showSettingsMessage("Settings saved.", "success");
}

// ===== 5. EVENTS AND START =====
saveBtn.addEventListener("click", saveSettings);
loadSettings();