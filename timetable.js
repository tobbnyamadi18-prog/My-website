// ===== 1. STATE =====
let slots = [];

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ===== 2. GRAB ELEMENTS =====
const timetableBox = document.getElementById("timetable");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

function todayNumber() {
    const day = new Date().getDay();
    return day === 0 ? 7 : day;
}

function formatTime(timeText) {
    const [hours, minutes] = timeText.split(":");
    const hour = Number(hours);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return hour12 + ":" + minutes + " " + suffix;
}

// ===== 4. SHOW THE TIMETABLE =====
function showTimetable() {
    const days = [1, 2, 3, 4, 5];
    if (slots.some(s => s.day_of_week === 6)) days.push(6);
    if (slots.some(s => s.day_of_week === 7)) days.push(7);

    const currentDay = todayNumber();

    timetableBox.innerHTML = days.map(day => {
        const daySlots = slots.filter(s => s.day_of_week === day);

        const slotHTML = daySlots.length === 0
            ? `<p class="empty">No sessions</p>`
            : daySlots.map(s => `
                <div class="slot ${s.kind === "study" ? "study" : ""}">
                    <strong>${escapeHTML(s.title)}</strong>
                    <small><i class="fa-regular fa-clock"></i> ${formatTime(s.start_time)} - ${formatTime(s.end_time)}</small>
                    ${s.location ? `<small><i class="fa-solid fa-location-dot"></i> ${escapeHTML(s.location)}</small>` : ""}
                </div>
            `).join("");

        return `
            <section class="day ${day === currentDay ? "today" : ""}">
                <h3>${DAY_NAMES[day]}</h3>
                ${slotHTML}
            </section>
        `;
    }).join("");
}

// ===== 5. LOAD FROM THE DATABASE =====
async function loadTimetable() {
    const { data, error } = await supabaseClient
        .from("timetable_slots")
        .select("id, day_of_week, title, kind, start_time, end_time, location")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Could not load timetable:", error.message);
        timetableBox.innerHTML = `<p class="empty">Could not load your timetable.</p>`;
        return;
    }

    slots = data;
    showTimetable();
}

// ===== 6. START =====
loadTimetable();