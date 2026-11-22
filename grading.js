// ===== GRADING SCALE =====
// This is a common 4.0-style scale. Edit the numbers to match YOUR university's scale.
const GRADE_SCALE = [
    { min: 80, letter: "A",  points: 4.0 },
    { min: 75, letter: "B+", points: 3.5 },
    { min: 70, letter: "B",  points: 3.0 },
    { min: 65, letter: "C+", points: 2.5 },
    { min: 60, letter: "C",  points: 2.0 },
    { min: 55, letter: "D+", points: 1.5 },
    { min: 50, letter: "D",  points: 1.0 },
    { min: 0,  letter: "F",  points: 0.0 }
];

const PASS_MARK = 50;
const MAX_POINTS = GRADE_SCALE[0].points;

function gradeFor(score) {
    return GRADE_SCALE.find(g => score >= g.min);
}

function calculateGPA(rows) {
    let totalPoints = 0;
    let totalCredits = 0;

    rows.forEach(row => {
        totalPoints += gradeFor(Number(row.score)).points * row.credits;
        totalCredits += row.credits;
    });

    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
}