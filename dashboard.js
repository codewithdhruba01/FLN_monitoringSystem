/**
 * Dashboard JavaScript for FLN Monitoring System
 */

const workbookSchoolDirectory = {
    Halol: [
        { id: 1, name: 'Abhetlav Primary School' },
        { id: 2, name: 'Academy Centre - Masvad' },
        { id: 3, name: 'Academy Centre - Arad' },
        { id: 4, name: 'Academy Centre - Govind Puri' },
        { id: 5, name: 'Aedalpura Primary School' },
        { id: 6, name: 'Govindpuri Remedial(LIB)' },
        { id: 7, name: 'Lalpuri Primary School' },
        { id: 8, name: 'Rahtlav Primary School' },
        { id: 9, name: 'Dhikva Primary School' },
        { id: 10, name: 'Kharkadi Primary School' },
        { id: 11, name: 'Nava Jakhriya Primary School' },
        { id: 12, name: 'Pindgini Muvadi Primary School' },
    ],
    Maval: [
        { id: 13, name: 'Shri Chhtrapati Shivaji Vcidya Mandir, Kanhe' },
        { id: 14, name: 'Shriram Vidyalaya, Navalakh Umbre' },
        { id: 15, name: 'Z P Primary Schoool, Bhoyare' },
        { id: 16, name: 'Z.P. Primary School,Ambi' },
        { id: 17, name: 'Z.P. Primary School, Badhalwadi' },
        { id: 18, name: 'Z.P.Primary School Nanoli Tarfe Chakan' },
        { id: 19, name: 'Z.P. Primary School, Navlakh Umbre' },
        { id: 20, name: 'Z.P. Primary School, Urse' },
        { id: 21, name: 'Z.P. Primary School, Varale' },
    ],
};

document.addEventListener('DOMContentLoaded', () => {
    const clusterSelect = document.getElementById('clusterSelect');
    const schoolSelect = document.getElementById('schoolSelect');
    const filterForm = document.getElementById('filterForm');

    // Populate Schools Based on Cluster
    clusterSelect.addEventListener('change', () => {
        const cluster = clusterSelect.value;
        schoolSelect.innerHTML = '<option value="">-- Select School --</option>';

        if (cluster && workbookSchoolDirectory[cluster]) {
            schoolSelect.innerHTML += '<option value="All">All Schools</option>';
            workbookSchoolDirectory[cluster].forEach(school => {
                const option = document.createElement('option');
                option.value = school.name;
                option.textContent = school.name;
                schoolSelect.appendChild(option);
            });
        }
    });

    // Handle Export PDF
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const cluster = clusterSelect.value;
        const school = schoolSelect.value;
        const className = document.getElementById('classSelect').value;
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;

        generatePDF(cluster, school, className, fromDate, toDate);
    });

    // Initialize Charts
    initCharts();
});

/**
 * Initializes Dashboard Charts with Dummy Data
 */
function initCharts() {
    // Custom Chart.js defaults for Neubrutalism style
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#222222';
    Chart.defaults.font.weight = '600';

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12,
                        weight: '700'
                    }
                }
            },
            tooltip: {
                backgroundColor: '#222222',
                titleFont: { size: 14, weight: '800' },
                bodyFont: { size: 13, weight: '600' },
                padding: 12,
                cornerRadius: 0,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#e0e0e0',
                    borderWidth: 2,
                    borderColor: '#222222'
                },
                ticks: {
                    font: { weight: '700' }
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { weight: '700' }
                }
            }
        }
    };

    // 1. Attendance Trends Chart
    const ctxAttendance = document.getElementById('attendanceChart').getContext('2d');
    new Chart(ctxAttendance, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Attendance %',
                data: [82, 85, 78, 92, 88, 80],
                borderColor: '#222222',
                backgroundColor: '#fcb900',
                borderWidth: 4,
                tension: 0, // Hard angles for brutalist look
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#222222',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: chartOptions
    });

    // 2. Overall Progress Chart
    const ctxProgress = document.getElementById('progressChart').getContext('2d');
    new Chart(ctxProgress, {
        type: 'doughnut',
        data: {
            labels: ['Level 1 (Basic)', 'Level 2 (Emerging)', 'Level 3 (Proficient)'],
            datasets: [{
                data: [25, 45, 30],
                backgroundColor: ['#ff4d4d', '#fcb900', '#4ade80'],
                borderWidth: 3,
                borderColor: '#222222',
                hoverOffset: 15
            }]
        },
        options: {
            ...chartOptions,
            cutout: '60%',
            scales: { display: false } // No scales for doughnut
        }
    });

    // 3. Cluster Comparison
    const ctxCluster = document.getElementById('clusterChart').getContext('2d');
    new Chart(ctxCluster, {
        type: 'bar',
        data: {
            labels: ['Halol', 'Maval'],
            datasets: [{
                label: 'Avg Completion',
                data: [75, 68],
                backgroundColor: ['#fcb900', '#222222'],
                borderWidth: 3,
                borderColor: '#222222'
            }]
        },
        options: {
            ...chartOptions,
            indexAxis: 'y' // Horizontal bar
        }
    });

    // 4. Subject-wise Student Level
    const ctxSubject = document.getElementById('subjectChart').getContext('2d');
    new Chart(ctxSubject, {
        type: 'bar',
        data: {
            labels: ['Language', 'English', 'Math', 'EVS', 'Science', 'Art'],
            datasets: [
                {
                    label: 'Level 1',
                    data: [10, 15, 20, 12, 18, 5],
                    backgroundColor: '#ff4d4d',
                    borderWidth: 2,
                    borderColor: '#222222'
                },
                {
                    label: 'Level 2',
                    data: [50, 45, 40, 48, 42, 35],
                    backgroundColor: '#fcb900',
                    borderWidth: 2,
                    borderColor: '#222222'
                },
                {
                    label: 'Level 3',
                    data: [40, 40, 40, 40, 40, 60],
                    backgroundColor: '#4ade80',
                    borderWidth: 2,
                    borderColor: '#222222'
                }
            ]
        },
        options: {
            ...chartOptions,
            scales: {
                y: { stacked: true },
                x: { stacked: true }
            }
        }
    });
}

/**
 * Generates a PDF Report using jsPDF
 */
function generatePDF(cluster, school, className, fromDate, toDate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Neubrutalism Design Elements in PDF
    // Header
    doc.setFillColor(252, 185, 0); // Yellow
    doc.rect(0, 0, 210, 40, 'F');
    doc.setDrawColor(34, 34, 34); // Black
    doc.setLineWidth(1);
    doc.line(0, 40, 210, 40);

    doc.setTextColor(34, 34, 34);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FLN MONITORING SYSTEM", 20, 20);
    doc.setFontSize(14);
    doc.text("REPORT SUMMARY", 20, 30);

    // Filter Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let y = 60;
    const labelX = 20;
    const valueX = 70;

    const addField = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, labelX, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), valueX, y);
        y += 12;
    };

    doc.setLineWidth(0.5);
    doc.rect(15, 50, 180, 75); // Border box for filters

    y = 65;
    addField("Cluster", cluster);
    addField("School", school);
    addField("Class", className);
    addField("From Date", fromDate);
    addField("To Date", toDate);
    addField("Report Generated", new Date().toLocaleDateString());

    // Analytics Mockup (Placeholder for real data)
    y = 145;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Performance Insights", 20, y);
    doc.setLineWidth(1);
    doc.line(20, y + 2, 80, y + 2);

    y += 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Average Attendance Rate: 84%", 20, y);
    y += 10;
    doc.text("Class 1-3 Performance: Level 2 (Emerging)", 20, y);
    y += 10;
    doc.text("Class 4-8 Performance: Level 3 (Proficient)", 20, y);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("© 2026 Space ECE India Foundation | Page 1", 105, 285, null, null, "center");

    // Save PDF
    const filename = `FLN_Report_${cluster}_${school.replace(/\s+/g, '_')}_${fromDate}.pdf`;
    doc.save(filename);

    alert(`Report generated successfully: ${filename}`);
}
