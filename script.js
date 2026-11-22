// ===== 1. DATA =====
const student = { name: "Student", gpa: 3.72 };

let courses = [];
let assignments = [];
let quizzes = [];

// ===== 2. GRAB ELEMENTS FROM THE PAGE =====
const greeting = document.getElementById("greeting");
const today = document.getElementById("today");
const courseList = document.getElementById("courseList");
const activityList = document.getElementById("activityList");
const searchInput = document.getElementById("searchInput");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function formatWhen(isoText) {
    return new Date(isoText).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
        hour: "numeric", minute: "2-digit", hour12: true
    });
}

async function loadTable(table, columns, orderBy) {
    const { data, error } = await supabaseClient
        .from(table)
        .select(columns)
        .order(orderBy, { ascending: true });

    if (error) {
        console.error("Could not load " + table + ":", error.message);
        return null;
    }
    return data;
}

// ===== 4. SHOW THINGS ON THE PAGE =====
function showProfile() {
    greeting.textContent = getGreeting() + ", ";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = student.name.split(" ")[0];
    greeting.appendChild(nameSpan);
    greeting.append(" 👋");

    document.getElementById("profileName").textContent = student.name;
    document.getElementById("avatar").textContent = student.name.charAt(0).toUpperCase();
    today.textContent = new Date().toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

function showStats() {
    const pending = assignments.filter(a => !a.submitted).length;
    const upcoming = quizzes.filter(q => !q.completed).length;
    document.getElementById("statCourses").textContent = courses.length;
    document.getElementById("statAssignments").textContent = pending;
    document.getElementById("statQuizzes").textContent = upcoming;
    document.getElementById("statGpa").textContent = student.gpa.toFixed(2);
}

function showCourses(list) {
    if (list.length === 0) {
        courseList.innerHTML = `<p class="empty">No courses found.</p>`;
        return;
    }
    courseList.innerHTML = list.map(c => `
        <div class="course">
            <div class="course-top">
                <span>${escapeHTML(c.name)} <small>(${escapeHTML(c.code)})</small></span>
                <strong>${Number(c.progress)}%</strong>
            </div>
            <div class="bar"><span style="width: ${Number(c.progress)}%"></span></div>
        </div>
    `).join("");
}

function buildActivities() {
    const items = [];
    const now = new Date();

    assignments.filter(a => !a.submitted).forEach(a => {
        items.push({
            title: a.title,
            type: "Assignment",
            icon: "fa-file-pen",
            when: a.due_at,
            overdue: new Date(a.due_at) < now
        });
    });

    quizzes.filter(q => !q.completed).forEach(q => {
        items.push({
            title: q.title,
            type: q.kind === "exam" ? "Exam" : "Quiz",
            icon: q.kind === "exam" ? "fa-pen-ruler" : "fa-circle-question",
            when: q.starts_at,
            overdue: false
        });
    });

    items.sort((a, b) => new Date(a.when) - new Date(b.when));
    return items;
}

function showActivities() {
    const items = buildActivities().slice(0, 5);

    if (items.length === 0) {
        activityList.innerHTML = `<p class="empty">Nothing coming up. You are all caught up!</p>`;
        return;
    }

    activityList.innerHTML = items.map(a => `
        <div class="activity">
            <i class="fa-solid ${a.icon}"></i>
            <div><strong>${escapeHTML(a.title)}</strong><small>${formatWhen(a.when)}</small></div>
            <span class="tag ${a.overdue ? "overdue" : ""}">${a.overdue ? "Overdue" : a.type}</span>
        </div>
    `).join("");
}

// ===== 5. EVENTS =====
searchInput.addEventListener("input", () => {
    const text = searchInput.value.toLowerCase();
    showCourses(courses.filter(c => c.name.toLowerCase().includes(text) || c.code.toLowerCase().includes(text)));
});

// ===== 6. START THE APP =====
async function startDashboard() {
    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        const user = data.session.user;
        student.name = user.user_metadata.full_name || user.email;
    }

    showProfile();

        const [courseRows, assignmentRows, quizRows, gradeRows] = await Promise.all([
        loadTable("courses", "name, code, progress", "code"),
        loadTable("assignments", "id, title, due_at, submitted", "due_at"),
        loadTable("quizzes", "id, title, kind, starts_at, completed", "starts_at"),
        loadTable("grades", "semester, credits, score", "semester")
    ]);

    courses = courseRows || [];
    assignments = assignmentRows || [];
    quizzes = quizRows || [];
    student.gpa = calculateGPA(gradeRows || []);

    showStats();
    showActivities();

    if (courseRows === null) {
        courseList.innerHTML = `<p class="empty">Could not load your courses.</p>`;
    } else {
        showCourses(courses);
    }
}

startDashboard();