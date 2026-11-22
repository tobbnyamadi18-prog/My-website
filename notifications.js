// ===== 1. STATE =====
let notifications = [];
let currentFilter = "all";

// ===== 2. GRAB ELEMENTS =====
const notificationList = document.getElementById("notificationList");
const notificationMessage = document.getElementById("notificationMessage");
const filterBox = document.getElementById("filters");
const markAllBtn = document.getElementById("markAllBtn");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

function safeIcon(name) {
    return /^fa-[a-z0-9-]+$/.test(name) ? name : "fa-bell";
}

function showMessage(text, type) {
    notificationMessage.textContent = text;
    notificationMessage.className = "form-message " + type;
}

function timeAgo(isoText) {
    const seconds = Math.floor((Date.now() - new Date(isoText).getTime()) / 1000);
    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + (minutes === 1 ? " minute ago" : " minutes ago");

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 30) return days + " days ago";

    return new Date(isoText).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function matchesFilter(n) {
    if (currentFilter === "unread") return !n.is_read;
    if (currentFilter === "read") return n.is_read;
    return true;
}

// ===== 4. SHOW THE LIST =====
function showNotifications() {
    const visible = notifications.filter(matchesFilter);

    if (visible.length === 0) {
        notificationList.innerHTML = `<p class="empty">Nothing in this view.</p>`;
        return;
    }

    notificationList.innerHTML = visible.map(n => `
        <article class="notification ${n.is_read ? "" : "unread"}">
            <div class="notification-icon"><i class="fa-solid ${safeIcon(n.icon)}"></i></div>
            <div class="notification-body">
                <strong>${escapeHTML(n.title)}</strong>
                <p>${escapeHTML(n.message)}</p>
                <small>${timeAgo(n.created_at)}</small>
            </div>
            ${n.is_read ? "" : `<span class="unread-dot"></span>`}
            <div class="file-actions">
                <button type="button" class="icon-action" data-action="toggle" data-id="${n.id}"
                    title="${n.is_read ? "Mark as unread" : "Mark as read"}">
                    <i class="fa-solid ${n.is_read ? "fa-envelope" : "fa-envelope-open"}"></i>
                </button>
                <button type="button" class="icon-action danger" data-action="delete" data-id="${n.id}" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </article>
    `).join("");
}

// ===== 5. LOAD FROM THE DATABASE =====
async function loadNotifications() {
    const { data, error } = await supabaseClient
        .from("notifications")
        .select("id, title, message, icon, is_read, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load notifications:", error.message);
        notificationList.innerHTML = `<p class="empty">Could not load your notifications.</p>`;
        return;
    }

    notifications = data;
    showNotifications();
    refreshBell();
}

// ===== 6. CHANGE NOTIFICATIONS =====
async function toggleRead(id) {
    const item = notifications.find(n => n.id === id);
    if (!item) return;

    const { error } = await supabaseClient
        .from("notifications")
        .update({ is_read: !item.is_read })
        .eq("id", id);

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    showMessage("", "");
    await loadNotifications();
}

async function deleteNotification(id) {
    const { error } = await supabaseClient.from("notifications").delete().eq("id", id);

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    showMessage("", "");
    await loadNotifications();
}

async function markAllRead() {
    const { error } = await supabaseClient
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);

    if (error) {
        showMessage(error.message, "error");
        return;
    }

    showMessage("All notifications marked as read.", "success");
    await loadNotifications();
}

// ===== 7. EVENTS =====
filterBox.addEventListener("click", event => {
    const chip = event.target.closest(".chip[data-filter]");
    if (!chip) return;

    currentFilter = chip.dataset.filter;
    filterBox.querySelectorAll(".chip[data-filter]").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    showNotifications();
});

markAllBtn.addEventListener("click", markAllRead);

notificationList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "toggle") toggleRead(button.dataset.id);
    if (button.dataset.action === "delete") deleteNotification(button.dataset.id);
});

// ===== 8. START =====
loadNotifications();