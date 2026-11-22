// ===== 1. SETTINGS =====
const BUCKET = "lectures";
const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg"];

let lectures = [];

// ===== 2. GRAB ELEMENTS =====
const titleInput = document.getElementById("lectureTitle");
const courseSelect = document.getElementById("lectureCourse");
const fileInput = document.getElementById("lectureFile");
const fileLabel = document.getElementById("fileLabel");
const uploadBtn = document.getElementById("uploadBtn");
const message = document.getElementById("lectureMessage");
const lectureList = document.getElementById("lectureList");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = "form-message " + type;
}

function getExtension(name) {
    return name.split(".").pop().toLowerCase();
}

function formatSize(bytes) {
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function iconFor(name) {
    const ext = getExtension(name);
    if (ext === "pdf") return "fa-file-pdf";
    if (ext === "ppt" || ext === "pptx") return "fa-file-powerpoint";
    if (ext === "doc" || ext === "docx") return "fa-file-word";
    if (ext === "png" || ext === "jpg" || ext === "jpeg") return "fa-file-image";
    return "fa-file";
}

function validateUpload(file) {
    if (titleInput.value.trim() === "") return "Please enter a title.";
    if (courseSelect.value === "") return "Please choose a course.";
    if (!file) return "Please choose a file to upload.";
    if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
        return "That file type is not allowed. Use PDF, PowerPoint, Word, PNG or JPG.";
    }
    if (file.size > MAX_SIZE) return "That file is too large. The maximum size is 20 MB.";
    return "";
}

function finishUpload() {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload";
}

// ===== 4. SHOW THE FILE LIST =====
function showLectures() {
    if (lectures.length === 0) {
        lectureList.innerHTML = `<p class="empty">No files uploaded yet.</p>`;
        return;
    }
    lectureList.innerHTML = lectures.map(l => `
        <article class="assignment">
            <div class="assignment-icon"><i class="fa-solid ${iconFor(l.file_name)}"></i></div>
            <div class="assignment-info">
                <strong>${escapeHTML(l.title)}</strong>
                <small>${escapeHTML(l.course)} &middot; ${escapeHTML(l.file_name)}</small>
            </div>
            <div class="assignment-due">${formatSize(l.file_size)}</div>
            <div class="file-actions">
                <button type="button" class="icon-action" data-action="download" data-id="${l.id}" title="Download"><i class="fa-solid fa-download"></i></button>
                <button type="button" class="icon-action danger" data-action="delete" data-id="${l.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </article>
    `).join("");
}

async function loadLectures() {
    const { data, error } = await supabaseClient
        .from("lectures")
        .select("id, title, course, file_path, file_name, file_size")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load files:", error.message);
        lectureList.innerHTML = `<p class="empty">Could not load your files.</p>`;
        return;
    }

    lectures = data;
    showLectures();
}

// ===== 5. UPLOAD =====
async function uploadLecture() {
    const file = fileInput.files[0];
    const problem = validateUpload(file);
    if (problem !== "") {
        showMessage(problem, "error");
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";
    showMessage("", "");

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session.user.id;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseClient.storage.from(BUCKET).upload(path, file);
    if (uploadError) {
        finishUpload();
        showMessage(uploadError.message, "error");
        return;
    }

    const { error: saveError } = await supabaseClient.from("lectures").insert({
        title: titleInput.value.trim(),
        course: courseSelect.value,
        file_path: path,
        file_name: file.name,
        file_size: file.size
    });

    if (saveError) {
        await supabaseClient.storage.from(BUCKET).remove([path]);
        finishUpload();
        showMessage(saveError.message, "error");
        return;
    }

    titleInput.value = "";
    courseSelect.value = "";
    fileInput.value = "";
    fileLabel.textContent = "Choose a file";
    finishUpload();
    showMessage("File uploaded successfully.", "success");
    await loadLectures();
}

// ===== 6. DOWNLOAD AND DELETE =====
async function downloadLecture(lecture) {
    const { data, error } = await supabaseClient.storage
        .from(BUCKET)
        .createSignedUrl(lecture.file_path, 60, { download: lecture.file_name });

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.click();
}

async function deleteLecture(lecture) {
    if (!confirm(`Delete "${lecture.title}"? This cannot be undone.`)) return;

    const { error: fileError } = await supabaseClient.storage.from(BUCKET).remove([lecture.file_path]);
    if (fileError) {
        showMessage(fileError.message, "error");
        return;
    }

    const { error: rowError } = await supabaseClient.from("lectures").delete().eq("id", lecture.id);
    if (rowError) {
        showMessage(rowError.message, "error");
        return;
    }

    showMessage("File deleted.", "success");
    await loadLectures();
}

// ===== 7. EVENTS =====
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    fileLabel.textContent = file ? file.name : "Choose a file";
});

uploadBtn.addEventListener("click", uploadLecture);

lectureList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const lecture = lectures.find(l => l.id === button.dataset.id);
    if (!lecture) return;

    if (button.dataset.action === "download") downloadLecture(lecture);
    if (button.dataset.action === "delete") deleteLecture(lecture);
});

// ===== 8. START =====
loadLectures();