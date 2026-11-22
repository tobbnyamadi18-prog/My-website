// ===== 1. STATE =====
let assignments = [];
let currentFilter = "all";

const STATUS_LABELS = { pending: "Pending", submitted: "Submitted", overdue: "Overdue" };

// ===== 2. GRAB ELEMENTS =====
const assignmentList = document.getElementById("assignmentList");
const assignmentMessage = document.getElementById("assignmentMessage");
const filterBox = document.getElementById("filters");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

function showMessage(text, type) {
    assignmentMessage.textContent = text;
    assignmentMessage.className = "form-message " + type;
}

function getStatus(assignment) {
    if (assignment.submitted) return "submitted";
    if (new Date(assignment.due_at) < new Date()) return "overdue";
    return "pending";
}

function formatDate(isoText) {
    return new Date(isoText).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
}

// ===== 4. SHOW THE LIST =====
function showAssignments() {
    const visible = assignments.filter(a => currentFilter === "all" || getStatus(a) === currentFilter);

    if (visible.length === 0) {
        assignmentList.innerHTML = `<p class="empty">No assignments in this view.</p>`;
        return;
    }

    assignmentList.innerHTML = visible.map(a => {
        const status = getStatus(a);
        const buttonText = a.submitted ? "Mark as not submitted" : "Mark as submitted";
        const buttonIcon = a.submitted ? "fa-rotate-left" : "fa-check";
        return `
            <article class="assignment">
                <div class="assignment-icon"><i class="fa-solid fa-file-pen"></i></div>
                <div class="assignment-info">
                    <strong>${escapeHTML(a.title)}</strong>
                    <small>${escapeHTML(a.course)}</small>
                </div>
                <div class="assignment-due"><i class="fa-regular fa-clock"></i> ${formatDate(a.due_at)}</div>
                <span class="status ${status}">${STATUS_LABELS[status]}</span>
                <div class="file-actions">
                    <button type="button" class="icon-action" data-id="${a.id}" title="${buttonText}">
                        <i class="fa-solid ${buttonIcon}"></i>
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

// ===== 5. LOAD FROM THE DATABASE =====
async function loadAssignments() {
    const { data, error } = await supabaseClient
        .from("assignments")
        .select("id, title, course, due_at, submitted")
        .order("due_at", { ascending: true });

    if (error) {
        console.error("Could not load assignments:", error.message);
        assignmentList.innerHTML = `<p class="empty">Could not load your assignments.</p>`;
        return;
    }

    assignments = data;
    showAssignments();
}

// ===== 6. MARK AS SUBMITTED =====
async function toggleSubmitted(id) {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    const { error } = await supabaseClient
        .from("assignments")
        .update({ submitted: !assignment.submitted })
        .eq("id", id);

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    showMessage("", "");
    await loadAssignments();
}

// ===== 7. EVENTS =====
filterBox.addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) return;

    currentFilter = chip.dataset.filter;
    filterBox.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    showAssignments();
});

assignmentList.addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (button) toggleSubmitted(button.dataset.id);
});

// ===== 8. START =====
loadAssignments();