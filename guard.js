// ===== PROTECT THE PAGE AND FILL THE PROFILE =====
document.body.style.visibility = "hidden";

async function refreshBell() {
    const bellDot = document.querySelector(".top-right .dot");
    if (!bellDot) return;

    const { count, error } = await supabaseClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);

    if (error) return;
    bellDot.style.display = count > 0 ? "block" : "none";
}

async function startPage() {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        window.location.href = "login.html";
        return;
    }

    const user = data.session.user;
    const fullName = user.user_metadata.full_name || user.email;

    const nameBox = document.getElementById("profileName");
    const avatarBox = document.getElementById("avatar");
    if (nameBox) nameBox.textContent = fullName;
    if (avatarBox) avatarBox.textContent = fullName.charAt(0).toUpperCase();

    document.body.style.visibility = "visible";
    refreshBell();
}

// ===== LOGOUT =====
const logoutLink = document.getElementById("logoutLink");
if (logoutLink) {
    logoutLink.addEventListener("click", async event => {
        event.preventDefault();
        if (confirm("Are you sure you want to log out?")) {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
        }
    });
}

// ===== MOBILE MENU =====
const sidebarBox = document.getElementById("sidebar");
const overlayBox = document.getElementById("overlay");
const menuButton = document.getElementById("menuBtn");

function toggleMenu() {
    sidebarBox.classList.toggle("open");
    overlayBox.classList.toggle("show");
}

if (menuButton && sidebarBox && overlayBox) {
    menuButton.addEventListener("click", toggleMenu);
    overlayBox.addEventListener("click", toggleMenu);
}

// ===== BELL BUTTON =====
const bellButton = document.querySelector(".top-right .icon-btn");
if (bellButton) {
    bellButton.addEventListener("click", () => {
        window.location.href = "notifications.html";
    });
}

startPage();