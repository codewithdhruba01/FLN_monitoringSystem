/* ============================================================
   FLN DAILY MONITORING SYSTEM - JAVASCRIPT
   Space ECE India Foundation
   ============================================================ */

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get URL parameter by name
 */
function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Set URL parameter and navigate
 */
function navigateWithParams(url, params) {
  const queryString = new URLSearchParams(params).toString();
  window.location.href = url + (queryString ? '?' + queryString : '');
}

/**
 * Validate a form field
 */
function validateField(field) {
  const value =
    field.type === 'checkbox' || field.type === 'radio'
      ? document.querySelector(`[name="${field.name}"]:checked`)
      : field.value.trim();

  if (!value) {
    field.closest('.form-group').classList.add('field-error');
    field.closest('.form-group').querySelector('.error-message')?.classList.add('show');
    return false;
  } else {
    field.closest('.form-group').classList.remove('field-error');
    field.closest('.form-group').querySelector('.error-message')?.classList.remove('show');
    return true;
  }
}

/**
 * Show error message
 */
function showError(fieldName, message) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (field) {
    const group = field.closest('.form-group');
    if (group) {
      group.classList.add('field-error');
      const errorEl = group.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
      }
    }
  }
}

// ============================================================
// CLUSTER SELECTION PAGE
// ============================================================

function initClusterPage() {
  const continueBtn = document.getElementById('continueBtn');
  const clusterSelect = document.getElementById('clusterSelect');

  if (continueBtn) {
    continueBtn.addEventListener('click', function () {
      const selectedCluster = clusterSelect.value;

      if (!selectedCluster) {
        showError('cluster', 'Please select a cluster');
        return;
      }

      navigateWithParams('schools.html', { cluster: selectedCluster });
    });
  }

  // Clear error on selection
  if (clusterSelect) {
    clusterSelect.addEventListener('change', function () {
      this.closest('.form-group').classList.remove('field-error');
      this.closest('.form-group').querySelector('.error-message')?.classList.remove('show');
    });
  }
}

// ============================================================
// SCHOOLS SELECTION PAGE
// ============================================================

const schoolsData = {
  Halol: [
    { id: 1, name: 'Halol Primary School' },
    { id: 2, name: 'Halol Model School' },
    { id: 3, name: 'Halol International School' },
  ],
  Maval: [
    { id: 4, name: 'Maval ZP School' },
    { id: 5, name: 'Maval Central School' },
    { id: 6, name: 'Maval High School' },
  ],
};

function initSchoolsPage() {
  const cluster = getUrlParameter('cluster');

  if (!cluster || !schoolsData[cluster]) {
    document.body.innerHTML =
      '<div style="padding: 40px; text-align: center;"><p>Invalid cluster selected.</p></div>';
    return;
  }

  // Update breadcrumb
  const breadcrumb = document.querySelector('.breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <div class="breadcrumb-item"><a href="cluster.html" style="color: #1E88E5; cursor: pointer;">Cluster</a></div>
      <div class="breadcrumb-separator">></div>
      <div class="breadcrumb-item active">School</div>
      <div class="breadcrumb-separator">></div>
      <div class="breadcrumb-item">Class Progress</div>
    `;
  }

  // Update heading
  const heading = document.querySelector('.page-heading h2');
  if (heading) {
    heading.textContent = `Schools in ${cluster}`;
  }

  // Populate school cards
  const schoolsList = document.getElementById('schoolsList');
  if (schoolsList) {
    schoolsList.innerHTML = schoolsData[cluster]
      .map(
        (school) => `
        <div class="school-card" onclick="handleSchoolSelect('${cluster}', '${school.name}')">
          <h3>${school.name}</h3>
          <p>Click to select</p>
        </div>
      `,
      )
      .join('');
  }
}

function handleSchoolSelect(cluster, school) {
  navigateWithParams('class-progress.html', { cluster: cluster, school: school });
}

// ============================================================
// CLASS PROGRESS PAGE
// ============================================================

const teachersData = ['Rajesh Kumar', 'Priya Singh', 'Arun Verma', 'Neha Sharma', 'Vikram Patel'];

const gradesData = {
  'Grade-I': ['I-A', 'I-B', 'I-C'],
  'Grade-II': ['II-A', 'II-B', 'II-C'],
  'Grade-III': ['III-A', 'III-B', 'III-C'],
};

const reasonsData = ['Holiday', 'Assembly', 'Examination', 'Other'];

const materialCheckboxes = ['Flashcards', 'Big Book', 'Workbook', 'Activity Kit', 'Blackboard', 'Other'];

const engagementLevels = ['Low', 'Medium', 'High'];

const subjectsData = [
  'Language / Hindi',
  'English',
  'Mathematics',
  'Environmental Studies',
  'Science',
  'Social Studies',
  'Art & Craft',
  'Physical Education',
  'Music',
  'Other'
];

const literacyCategories = [
  'Oral Language Development',
  'Phonological Awareness',
  'Letter Recognition',
  'Reading',
  'Writing',
];

const numeracyCategories = [
  'Pre-number Concepts',
  'Number Recognition',
  'Counting',
  'Operations',
  'Shapes',
];

// Sample student data
let currentStudents = [];

function normalizeKey(str) {
  return String(str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12);
}

function cssEscapeIdent(value) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return String(value).replace(/["\\]/g, '\\$&');
}

function buildStudentsForSchool(cluster, school, count = 32) {
  const clusterKey = normalizeKey(cluster);
  const schoolKey = normalizeKey(school);

  const manualStudentsData = {
    Halol: {
      'Halol Primary School': [
        { id: 'HPS-001', name: 'Akash' },
        { id: 'HPS-002', name: 'Alok' },
        { id: 'HPS-003', name: 'Suva' },
        { id: 'HPS-004', name: 'Raj' },
        { id: 'HPS-005', name: 'Arnab' },
        { id: 'HPS-006', name: 'Birat' },
        { id: 'HPS-007', name: 'Jit' },
        { id: 'HPS-008', name: 'Ashok' },
        { id: 'HPS-009', name: 'Abhiraj' },
        { id: 'HPS-010', name: 'Rohan' },
      ],
      'Halol Model School': [
        { id: 'HMS-001', name: 'Meera' },
        { id: 'HMS-002', name: 'Saniya' },
        { id: 'HMS-003', name: 'Kunal' },
        { id: 'HMS-004', name: 'Dev' },
        { id: 'HMS-005', name: 'Isha' },
        { id: 'HMS-006', name: 'Nirav' },
        { id: 'HMS-007', name: 'Pooja' },
        { id: 'HMS-008', name: 'Rahul' },
        { id: 'HMS-009', name: 'Priyansh' },
        { id: 'HMS-010', name: 'Anaya' },
      ],
      'Halol International School': [
        { id: 'HIS-001', name: 'Aarav' },
        { id: 'HIS-002', name: 'Diya' },
        { id: 'HIS-003', name: 'Vivaan' },
        { id: 'HIS-004', name: 'Kiara' },
        { id: 'HIS-005', name: 'Arjun' },
        { id: 'HIS-006', name: 'Nisha' },
        { id: 'HIS-007', name: 'Kabir' },
        { id: 'HIS-008', name: 'Reyansh' },
        { id: 'HIS-009', name: 'Riya' },
        { id: 'HIS-010', name: 'Ishan' },
      ],
    },
    Maval: {
      'Maval ZP School': [
        { id: 'MZP-001', name: 'Suvam' },
        { id: 'MZP-002', name: 'Nikhil' },
        { id: 'MZP-003', name: 'Aditi' },
        { id: 'MZP-004', name: 'Sagar' },
        { id: 'MZP-005', name: 'Ritu' },
        { id: 'MZP-006', name: 'Aman' },
        { id: 'MZP-007', name: 'Neha' },
        { id: 'MZP-008', name: 'Sohan' },
        { id: 'MZP-009', name: 'Ankit' },
        { id: 'MZP-010', name: 'Kavya' },
      ],
      'Maval Central School': [
        { id: 'MCS-001', name: 'Pranav' },
        { id: 'MCS-002', name: 'Sneha' },
        { id: 'MCS-003', name: 'Rakesh' },
        { id: 'MCS-004', name: 'Pallavi' },
        { id: 'MCS-005', name: 'Naman' },
        { id: 'MCS-006', name: 'Ira' },
        { id: 'MCS-007', name: 'Siddharth' },
        { id: 'MCS-008', name: 'Bhavna' },
        { id: 'MCS-009', name: 'Aditya' },
        { id: 'MCS-010', name: 'Sonal' },
      ],
      'Maval High School': [
        { id: 'MHS-001', name: 'Varun' },
        { id: 'MHS-002', name: 'Kritika' },
        { id: 'MHS-003', name: 'Manish' },
        { id: 'MHS-004', name: 'Riyaansh' },
        { id: 'MHS-005', name: 'Nandini' },
        { id: 'MHS-006', name: 'Gaurav' },
        { id: 'MHS-007', name: 'Shreya' },
        { id: 'MHS-008', name: 'Arpit' },
        { id: 'MHS-009', name: 'Tanish' },
        { id: 'MHS-010', name: 'Anushka' },
      ],
    },
  };

  const manualList = manualStudentsData?.[cluster]?.[school];
  if (Array.isArray(manualList) && manualList.length) {
    return manualList.slice(0, 10).map((s, idx) => ({
      id: s.id,
      name: s.name,
      rollNo: idx + 1,
    }));
  }

  // fallback: auto-generate if manual list missing
  const n = Math.max(1, Number(count) || 10);
  return Array.from({ length: n }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    const studentId = `${clusterKey}-${schoolKey}-${num}`;

    return {
      id: studentId,
      name: `Student ${i + 1}`,
      rollNo: i + 1,
    };
  });
}

function initClassProgressPage() {
  const cluster = getUrlParameter('cluster');
  const school = getUrlParameter('school');

  if (!cluster || !school) {
    document.body.innerHTML =
      '<div style="padding: 40px; text-align: center;"><h2>Invalid selection. <a href="cluster.html">Go back</a></h2></div>';
    return;
  }

  // Update breadcrumb
  const breadcrumb = document.querySelector('.breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <div class="breadcrumb-item"><a href="cluster.html" style="color: #1E88E5; cursor: pointer;">Cluster</a></div>
      <div class="breadcrumb-separator">></div>
      <div class="breadcrumb-item"><a href="schools.html?cluster=${cluster}" style="color: #1E88E5; cursor: pointer;">School</a></div>
      <div class="breadcrumb-separator">></div>
      <div class="breadcrumb-item active">Class Progress</div>
    `;
  }

  // Update heading
  const heading = document.querySelector('.page-heading h2');
  if (heading) {
    heading.textContent = `Daily FLN Monitoring – ${school}`;
  }

  // Populate teacher dropdown
  const teacherSelect = document.getElementById('teacher');
  if (teacherSelect) {
    teacherSelect.innerHTML =
      '<option value="">-- Select Teacher --</option>' +
      teachersData.map((t) => `<option value="${t}">${t}</option>`).join('');
  }

  // Populate grade dropdown
  const gradeSelect = document.getElementById('grade');
  if (gradeSelect) {
    gradeSelect.innerHTML =
      '<option value="">-- Select Grade --</option>' +
      Object.keys(gradesData)
        .map((g) => `<option value="${g}">${g}</option>`)
        .join('');

    gradeSelect.addEventListener('change', updateSectionDropdown);
  }

  // Initialize section dropdown
  const sectionSelect = document.getElementById('section');
  if (sectionSelect) {
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
  }

  // Set today's date
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Populate FLN Period radio buttons
  const flnPeriodContainer = document.getElementById('flnPeriodContainer');
  if (flnPeriodContainer) {
    flnPeriodContainer.innerHTML = `
      <div class="radio-item">
        <input type="radio" id="flnYes" name="flnPeriod" value="yes" onchange="updateReasonVisibility()">
        <label for="flnYes">Yes</label>
      </div>
      <div class="radio-item">
        <input type="radio" id="flnNo" name="flnPeriod" value="no" onchange="updateReasonVisibility()">
        <label for="flnNo">No</label>
      </div>
    `;
  }

  // Populate reason dropdown
  const reasonSelect = document.getElementById('reason');
  if (reasonSelect) {
    reasonSelect.innerHTML =
      '<option value="">-- Select Reason --</option>' +
      reasonsData.map((r) => `<option value="${r}">${r}</option>`).join('');
  }

  // Populate duration radio buttons
  const durationContainer = document.getElementById('durationContainer');
  if (durationContainer) {
    durationContainer.innerHTML = [30, 45, 60]
      .map(
        (d) => `
        <div class="radio-item">
          <input type="radio" id="duration${d}" name="duration" value="${d}">
          <label for="duration${d}">${d} minutes</label>
        </div>
      `,
      )
      .join('');
  }

  // Populate materials checkboxes
  const materialsContainer = document.getElementById('materialsContainer');
  if (materialsContainer) {
    materialsContainer.innerHTML = materialCheckboxes
      .map(
        (m) => `
        <div class="checkbox-item">
          <input type="checkbox" id="material${m}" name="materials" value="${m}">
          <label for="material${m}">${m}</label>
        </div>
      `,
      )
      .join('');
  }

  // Populate engagement radio buttons
  const engagementContainer = document.getElementById('engagementContainer');
  if (engagementContainer) {
    engagementContainer.innerHTML = engagementLevels
      .map(
        (e) => `
        <div class="radio-item">
          <input type="radio" id="engagement${e}" name="engagement" value="${e}">
          <label for="engagement${e}">${e}</label>
        </div>
      `,
      )
      .join('');
  }

  // Populate subjects checkboxes
  const subjectsContainer = document.getElementById('subjectsContainer');
  if (subjectsContainer) {
    subjectsContainer.innerHTML = subjectsData
      .map(
        (s) => `
        <div class="checkbox-item">
          <input type="checkbox" id="subject${s.replace(/[^a-zA-Z0-9]/g, '')}" name="subjects" value="${s}">
          <label for="subject${s.replace(/[^a-zA-Z0-9]/g, '')}">${s}</label>
        </div>
      `,
      )
      .join('');
  }

  // Populate literacy focus dropdown
  const literacyFocusSelect = document.getElementById('literacyFocus');
  if (literacyFocusSelect) {
    literacyFocusSelect.innerHTML =
      '<option value="">-- Select Category --</option>' +
      literacyCategories.map((l) => `<option value="${l}">${l}</option>`).join('');
  }

  // Populate numeracy focus dropdown
  const numeracyFocusSelect = document.getElementById('numeracyFocus');
  if (numeracyFocusSelect) {
    numeracyFocusSelect.innerHTML =
      '<option value="">-- Select Category --</option>' +
      numeracyCategories.map((n) => `<option value="${n}">${n}</option>`).join('');
  }

  // Populate student table
  currentStudents = buildStudentsForSchool(cluster, school, 10);
  populateStudentTable(currentStudents);
  populateAttendanceTable(currentStudents);

  // Setup form submission
  const form = document.getElementById('classProgressForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

function updateSectionDropdown() {
  const gradeSelect = document.getElementById('grade');
  const sectionSelect = document.getElementById('section');

  const selectedGrade = gradeSelect.value;

  if (!selectedGrade || !gradesData[selectedGrade]) {
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
    return;
  }

  sectionSelect.innerHTML =
    '<option value="">-- Select Section --</option>' +
    gradesData[selectedGrade].map((s) => `<option value="${s}">${s}</option>`).join('');
}

function updateReasonVisibility() {
  const flnNo = document.getElementById('flnNo').checked;
  const reasonSection = document.getElementById('reasonSection');

  if (reasonSection) {
    reasonSection.style.display = flnNo ? 'block' : 'none';

    const reasonSelect = document.getElementById('reason');
    if (!flnNo && reasonSelect) {
      reasonSelect.value = '';
      reasonSelect.closest('.form-group').classList.remove('field-error');
      reasonSelect.closest('.form-group').querySelector('.error-message')?.classList.remove('show');
    }
  }
}

function populateStudentTable(students) {
  const tbody = document.querySelector('#studentTable tbody');

  if (!tbody) return;

  tbody.innerHTML = (students || [])
    .map(
      (student) => `
    <tr>
      <td>${student.name}</td>
      <td>
        <div class="performance-level">
          <button type="button" class="level-btn level-1" data-student="${student.id}" data-level="1" onclick="selectPerformanceLevel(this)">1</button>
          <button type="button" class="level-btn level-2" data-student="${student.id}" data-level="2" onclick="selectPerformanceLevel(this)">2</button>
          <button type="button" class="level-btn level-3" data-student="${student.id}" data-level="3" onclick="selectPerformanceLevel(this)">3</button>
        </div>
      </td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" name="support_${student.id}" value="yes">
          <span class="toggle-slider"></span>
        </label>
      </td>
    </tr>
  `,
    )
    .join('');
}

function populateAttendanceTable(students) {
  const tbody = document.querySelector('#attendanceTable tbody');
  if (!tbody) return;

  tbody.innerHTML = (students || [])
    .map(
      (student) => `
    <tr data-student="${student.id}">
      <td>${student.name}</td>
      <td>${student.id}</td>
      <td>
        <div class="attendance-actions">
          <button type="button" class="attendance-btn present" data-student="${student.id}" data-status="present" onclick="selectAttendance(this)">Present</button>
          <button type="button" class="attendance-btn absent" data-student="${student.id}" data-status="absent" onclick="selectAttendance(this)">Absent</button>
        </div>
        <input type="hidden" name="attendance_${student.id}" value="" />
      </td>
    </tr>
  `,
    )
    .join('');
}

function selectAttendance(btn) {
  const student = btn.dataset.student;
  const status = btn.dataset.status;
  const row = btn.closest('tr');
  if (!row) return;

  row.querySelectorAll('.attendance-btn').forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');

  const hidden = row.querySelector(`input[name="attendance_${cssEscapeIdent(student)}"]`);
  if (hidden) hidden.value = status;
}

function selectPerformanceLevel(btn) {
  const level = btn.dataset.level;
  const student = btn.dataset.student;

  // Remove selected from all buttons in this performance level group
  const parent = btn.parentElement;
  parent.querySelectorAll('.level-btn').forEach((b) => {
    b.classList.remove('selected');
  });

  // Add selected to clicked button
  btn.classList.add('selected');

  // Store the selection
  document.body.dataset[`student_${student}_level`] = level;
}

function handleFormSubmit(e) {
  e.preventDefault();

  // Validate required fields
  let isValid = true;

  // Check basic fields
  const requiredFields = [
    'teacher',
    'grade',
    'section',
    'date',
    'studentsPresent',
    'flnPeriod',
    'duration',
    'engagement',
    'mainTopic',
    'literacyFocus',
    'literacyConcept',
    'numeracyFocus',
    'numeracyConcept',
  ];

  for (let fieldName of requiredFields) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      if (!validateField(field)) {
        isValid = false;
      }
    }
  }

  // Check if FLN No is selected and validate reason
  const flnNo = document.getElementById('flnNo')?.checked;
  if (flnNo) {
    const reasonField = document.querySelector('[name="reason"]');
    if (reasonField && !validateField(reasonField)) {
      isValid = false;
    }
  }

  // Validate materials (at least one checkbox)
  const materialsCheckboxes = document.querySelectorAll('input[name="materials"]:checked');
  if (materialsCheckboxes.length === 0) {
    showError('materials', 'Please select at least one teaching material');
    isValid = false;
  }

  // Validate subjects (at least one checkbox)
  const subjectsCheckboxes = document.querySelectorAll('input[name="subjects"]:checked');
  if (subjectsCheckboxes.length === 0) {
    showError('subjects', 'Please select at least one subject');
    isValid = false;
  }

  // Validate student performance levels
  const studentRows = document.querySelectorAll('#studentTable tbody tr');
  for (let row of studentRows) {
    const selectedLevel = row.querySelector('.level-btn.selected');
    if (!selectedLevel) {
      row.classList.add('field-error');
      const studentName = row.querySelector('td:first-child').textContent;
      console.warn(`Performance level not selected for ${studentName}`);
      isValid = false;
    }
  }

  // Validate attendance selection
  const attendanceRows = document.querySelectorAll('#attendanceTable tbody tr');
  for (let row of attendanceRows) {
    const selected = row.querySelector('.attendance-btn.selected');
    if (!selected) {
      row.classList.add('field-error');
      const studentName = row.querySelector('td:first-child').textContent;
      console.warn(`Attendance not selected for ${studentName}`);
      isValid = false;
    }
  }

  if (!isValid) {
    console.error('Form validation failed. Please check all required fields.');
    return;
  }

  // Compile form data
  const formData = {
    cluster: getUrlParameter('cluster'),
    school: getUrlParameter('school'),
    teacher: document.getElementById('teacher').value,
    grade: document.getElementById('grade').value,
    section: document.getElementById('section').value,
    date: document.getElementById('date').value,
    studentsPresent: document.getElementById('studentsPresent').value,
    flnPeriod: document.querySelector('input[name="flnPeriod"]:checked').value,
    reason: document.getElementById('reason').value || null,
    duration: document.querySelector('input[name="duration"]:checked').value,
    materials: Array.from(document.querySelectorAll('input[name="materials"]:checked')).map(
      (cb) => cb.value,
    ),
    engagement: document.querySelector('input[name="engagement"]:checked').value,
    subjects: Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(
      (cb) => cb.value,
    ),
    mainTopic: document.getElementById('mainTopic').value,
    literacyFocus: document.getElementById('literacyFocus').value,
    literacyConcept: document.getElementById('literacyConcept').value,
    numeracyFocus: document.getElementById('numeracyFocus').value,
    numeracyConcept: document.getElementById('numeracyConcept').value,
    remarks: document.getElementById('remarks').value,
    studentPerformance: [],
    attendanceSheet: [],
  };

  // Collect student performance data
  const tbody = document.querySelector('#studentTable tbody');
  tbody.querySelectorAll('tr').forEach((row, index) => {
    const studentName = row.querySelector('td:first-child').textContent;
    const level = row.querySelector('.level-btn.selected').dataset.level;
    const supportsNeeded = row.querySelector('input[type="checkbox"]').checked;

    formData.studentPerformance.push({
      studentNumber: index + 1,
      name: studentName,
      performanceLevel: parseInt(level),
      needsSupport: supportsNeeded,
    });
  });

  // Collect attendance data
  const attendanceBody = document.querySelector('#attendanceTable tbody');
  attendanceBody.querySelectorAll('tr').forEach((row, index) => {
    const name = row.querySelector('td:first-child').textContent;
    const studentId = row.querySelector('td:nth-child(2)').textContent;
    const status = row.querySelector('.attendance-btn.selected')?.dataset.status || null;

    formData.attendanceSheet.push({
      studentNumber: index + 1,
      studentId,
      name,
      attendance: status,
    });
  });

  console.log('Form Data Submitted:', formData);
  console.log('✅ Form submission successful!');

  // Show success message
  showSuccessMessage();
}

function showSuccessMessage() {
  const form = document.getElementById('classProgressForm');
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #4CAF50;
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    z-index: 9999;
  `;
  messageEl.textContent = '✅ Form submitted successfully! Check console for details.';
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 4000);
}

// ============================================================
// PAGE INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const currentPage = document.body.getAttribute('data-page');

  if (currentPage === 'cluster') {
    initClusterPage();
  } else if (currentPage === 'schools') {
    initSchoolsPage();
  } else if (currentPage === 'class-progress') {
    initClassProgressPage();
  }
});
