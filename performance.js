// ===== 1. STATE =====
let grades = [];

// ===== 2. GRAB ELEMENTS =====
const gradeList = document.getElementById("gradeList");
const gradeHeading = document.getElementById("gradeHeading");
const trendBox = document.getElementById("trend");

// ===== 3. HELPER FUNCTIONS =====
function escapeHTML(text) {
    const box = document.createElement("div");
    box.textContent = text;
    return box.innerHTML;
}

// ===== 4. SHOW THE SUMMARY CARDS =====
function showSummary() {
    const passed = grades.filter(g => Number(g.score) >= PASS_MARK);
    const credits = passed.reduce((sum, g) => sum + g.credits, 0);
    const total = grades.reduce((sum, g) => sum + Number(g.score), 0);
    const average = grades.length === 0 ? 0 : total / grades.length;

    document.getElementById("statCredits").textContent = credits;
    document.getElementById("statPassed").textContent = passed.length;
    document.getElementById("statAverage").textContent = Math.round(average) + "%";
    document.getElementById("statGpa").textContent = calculateGPA(grades).toFixed(2);
}

// ===== 5. SHOW THE LATEST SEMESTER'S GRADES =====
function showGrades() {
    if (grades.length === 0) {
        gradeList.innerHTML = `<p class="empty">No grades have been published yet.</p>`;
        return;
    }

    const latest = Math.max(...grades.map(g => g.semester));
    gradeHeading.textContent = "Grades by Course (Semester " + latest + ")";

    gradeList.innerHTML = grades
        .filter(g => g.semester === latest)
        .map(g => {
            const score = Number(g.score);
            return `
                <div class="grade">
                    <div class="course-top">
                        <span>${escapeHTML(g.course)}</span>
                        <span><strong>${score}%</strong><b class="letter">${gradeFor(score).letter}</b></span>
                    </div>
                    <div class="bar"><span style="width: ${score}%"></span></div>
                </div>
            `;
        }).join("");
}

// ===== 6. SHOW THE GPA PER SEMESTER =====
function showTrend() {
    const semesters = [...new Set(grades.map(g => g.semester))].sort((a, b) => a - b);

    trendBox.innerHTML = semesters.map(semester => {
        const gpa = calculateGPA(grades.filter(g => g.semester === semester));
        const height = Math.round((gpa / MAX_POINTS) * 100);
        return `
            <div class="trend-col">
                <div class="trend-track"><div class="trend-bar" style="height: ${height}%"></div></div>
                <strong>${gpa.toFixed(2)}</strong>
                <small>Sem ${semester}</small>
            </div>
        `;
    }).join("");
}

// ===== 7. LOAD FROM THE DATABASE =====
async function loadGrades() {
    const { data, error } = await supabaseClient
        .from("grades")
        .select("course, semester, credits, score")
        .order("semester", { ascending: true })
        .order("course", { ascending: true });

    if (error) {
        console.error("Could not load grades:", error.message);
        gradeList.innerHTML = `<p class="empty">Could not load your grades.</p>`;
        return;
    }

    grades = data;
    showSummary();
    showGrades();
    showTrend();
}

// ===== 8. START =====
loadGrades();