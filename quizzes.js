// ===== 1. STATE =====
let quizzes = [];
let currentFilter = "all";

// ===== 2. GRAB ELEMENTS =====
const quizList = document.getElementById("quizList");
const quizMessage = document.getElementById("quizMessage");
const filterBox = document.getElementById("filters");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

function showMessage(text, type) {
    quizMessage.textContent = text;
    quizMessage.className = "form-message " + type;
}

function formatDateTime(isoText) {
    return new Date(isoText).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true
    });
}

function matchesFilter(quiz) {
    if (currentFilter === "all") return true;
    if (currentFilter === "completed") return quiz.completed;
    return quiz.kind === currentFilter;
}

// ===== 4. SHOW THE LIST =====
function showQuizzes() {
    const visible = quizzes.filter(matchesFilter);

    if (visible.length === 0) {
        quizList.innerHTML = `<p class="empty">Nothing in this view.</p>`;
        return;
    }

    quizList.innerHTML = visible.map(q => {
        const icon = q.kind === "exam" ? "fa-pen-ruler" : "fa-circle-question";
        const kindLabel = q.kind === "exam" ? "Exam" : "Quiz";
        const status = q.completed ? "completed" : "upcoming";
        const statusLabel = q.completed ? "Completed" : "Upcoming";
        const buttonText = q.completed ? "Mark as not completed" : "Mark as completed";
        const buttonIcon = q.completed ? "fa-rotate-left" : "fa-check";
        return `
            <article class="assignment">
                <div class="assignment-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="assignment-info">
                    <strong>${escapeHTML(q.title)}</strong>
                    <small>${escapeHTML(q.course)} &middot; ${kindLabel}</small>
                </div>
                <div class="assignment-due"><i class="fa-regular fa-clock"></i> ${formatDateTime(q.starts_at)}</div>
                <span class="status ${status}">${statusLabel}</span>
                <div class="file-actions">
                    <button type="button" class="icon-action" data-id="${q.id}" title="${buttonText}">
                        <i class="fa-solid ${buttonIcon}"></i>
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

// ===== 5. LOAD FROM THE DATABASE =====
async function loadQuizzes() {
    const { data, error } = await supabaseClient
        .from("quizzes")
        .select("id, title, course, kind, starts_at, completed")
        .order("starts_at", { ascending: true });

    if (error) {
        console.error("Could not load quizzes:", error.message);
        quizList.innerHTML = `<p class="empty">Could not load your quizzes and exams.</p>`;
        return;
    }

    quizzes = data;
    showQuizzes();
}

// ===== 6. MARK AS COMPLETED =====
async function toggleCompleted(id) {
    const quiz = quizzes.find(q => q.id === id);
    if (!quiz) return;

    const { error } = await supabaseClient
        .from("quizzes")
        .update({ completed: !quiz.completed })
        .eq("id", id);

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    showMessage("", "");
    await loadQuizzes();
}

// ===== 7. EVENTS =====
filterBox.addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) return;

    currentFilter = chip.dataset.filter;
    filterBox.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    showQuizzes();
});

quizList.addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (button) toggleCompleted(button.dataset.id);
});

// ===== 8. START =====
loadQuizzes();