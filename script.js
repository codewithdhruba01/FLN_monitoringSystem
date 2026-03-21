/* ============================================================
   FLN DAILY MONITORING SYSTEM - JAVASCRIPT
   Space ECE India Foundation
   ============================================================ */

const API_ENDPOINTS = {
  schools: 'api/get_schools.php',
  schoolContext: 'api/get_school_context.php',
  saveMonitoring: 'api/save_monitoring.php',
};

const fallbackSchoolsData = {
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

const fallbackTeachersData = [
  { id: 1, name: 'Rajesh Kumar' },
  { id: 2, name: 'Priya Singh' },
  { id: 3, name: 'Arun Verma' },
  { id: 4, name: 'Neha Sharma' },
  { id: 5, name: 'Vikram Patel' },
];

const fallbackStudents = [
  { id: 1, name: 'Aarav Sharma' },
  { id: 2, name: 'Vivaan Patel' },
  { id: 3, name: 'Ananya Singh' },
  { id: 4, name: 'Diya Verma' },
  { id: 5, name: 'Aditya Kumar' },
  { id: 6, name: 'Ishita Nair' },
  { id: 7, name: 'Krish Yadav' },
  { id: 8, name: 'Meera Joshi' },
  { id: 9, name: 'Arjun Reddy' },
  { id: 10, name: 'Saanvi Gupta' },
  { id: 11, name: 'Reyansh Mehta' },
  { id: 12, name: 'Kavya Iyer' },
];

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
  'Other',
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

let currentSchoolContext = null;

function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function navigateWithParams(url, params) {
  window.location.href = buildUrlWithParams(url, params);
}

function buildUrlWithParams(url, params) {
  const queryString = new URLSearchParams(params).toString();
  return url + (queryString ? '?' + queryString : '');
}

function renderFatalPageError(message) {
  document.body.innerHTML = `
    <div style="padding: 40px; text-align: center;">
      <h2>${message}</h2>
      <p style="margin-top: 12px;"><a href="cluster.html">Go back to cluster selection</a></p>
    </div>
  `;
}

function createSchoolCardElement(cluster, school) {
  const card = document.createElement('a');
  card.className = 'course-card card-yellow';
  card.href = buildUrlWithParams('class-progress.html', { cluster, school: school.name });
  card.dataset.cluster = cluster;
  card.dataset.school = school.name;
  card.setAttribute('aria-label', `Open ${school.name}`);

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = cluster;

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = school.name;

  const subtitle = document.createElement('p');
  subtitle.className = 'card-subtitle';
  subtitle.textContent = 'Click to select';

  content.appendChild(title);
  content.appendChild(subtitle);
  
  card.appendChild(badge);
  card.appendChild(content);

  return card;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

async function loadSchoolsForCluster(cluster) {
  try {
    const payload = await fetchJson(`${API_ENDPOINTS.schools}?cluster=${encodeURIComponent(cluster)}`);
    return payload.data.schools;
  } catch (error) {
    console.warn('Unable to load schools from database. Using fallback school list.', error);
    return fallbackSchoolsData[cluster] || [];
  }
}

async function loadSchoolContext(cluster, school) {
  try {
    const payload = await fetchJson(
      `${API_ENDPOINTS.schoolContext}?cluster=${encodeURIComponent(cluster)}&school=${encodeURIComponent(school)}`,
    );

    return payload.data;
  } catch (error) {
    console.warn('Unable to load school context from database. Using fallback data.', error);
    return {
      cluster: { id: cluster === 'Halol' ? 1 : 2, name: cluster },
      school: { id: null, name: school },
      teachers: fallbackTeachersData,
      students: fallbackStudents,
    };
  }
}

function validateField(field) {
  const value =
    field.type === 'checkbox' || field.type === 'radio'
      ? document.querySelector(`[name="${field.name}"]:checked`)
      : field.value.trim();

  if (!value) {
    field.closest('.form-group').classList.add('field-error');
    field.closest('.form-group').querySelector('.error-message')?.classList.add('show');
    return false;
  }

  field.closest('.form-group').classList.remove('field-error');
  field.closest('.form-group').querySelector('.error-message')?.classList.remove('show');
  return true;
}

function showError(fieldName, message) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!field) return;

  const group = field.closest('.form-group');
  if (!group) return;

  group.classList.add('field-error');
  const errorEl = group.querySelector('.error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

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

  if (clusterSelect) {
    clusterSelect.addEventListener('change', function () {
      this.closest('.form-group').classList.remove('field-error');
      this.closest('.form-group').querySelector('.error-message')?.classList.remove('show');
    });
  }
}

async function initSchoolsPage() {
  const cluster = getUrlParameter('cluster');

  if (!cluster || !fallbackSchoolsData[cluster]) {
    renderFatalPageError('Invalid cluster selected.');
    return;
  }

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

  const heading = document.querySelector('.page-heading h2');
  if (heading) {
    heading.textContent = `Schools in ${cluster}`;
  }

  const schoolsList = document.getElementById('schoolsList');
  if (!schoolsList) return;

  const schools = await loadSchoolsForCluster(cluster);
  schoolsList.replaceChildren(...schools.map((school) => createSchoolCardElement(cluster, school)));

  schoolsList.querySelectorAll('.school-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (!card.getAttribute('href')) {
        handleSchoolSelect(card.dataset.cluster, card.dataset.school);
      }
    });
  });
}

function handleSchoolSelect(cluster, school) {
  navigateWithParams('class-progress.html', { cluster, school });
}

async function initClassProgressPage() {
  const cluster = getUrlParameter('cluster');
  const school = getUrlParameter('school');

  if (!cluster || !school) {
    renderFatalPageError('Invalid school selection.');
    return;
  }

  currentSchoolContext = await loadSchoolContext(cluster, school);

  const breadcrumb = document.querySelector('.breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <div class="breadcrumb-item"><a href="cluster.html" style="color: #1E88E5; cursor: pointer;">Cluster</a></div>
      <div class="breadcrumb-separator">></div>
      <div class="breadcrumb-item"><a href="schools.html?cluster=${encodeURIComponent(cluster)}" style="color: #1E88E5; cursor: pointer;">School</a></div>
      <div class="breadcrumb-separator">></div>
      <div class="breadcrumb-item active">Class Progress</div>
    `;
  }

  const heading = document.querySelector('.page-heading h2');
  if (heading) {
    heading.textContent = `Daily FLN Monitoring - ${school}`;
  }

  populateTeacherDropdown(currentSchoolContext.teachers || fallbackTeachersData);
  populateGradeDropdown();
  populateDateField();
  setupAttendanceBreakdown(cluster);
  populateRadioAndCheckboxGroups();
  populateFocusDropdowns();
  populateStudentTable(currentSchoolContext.students || fallbackStudents);
  populateAttendanceTable(currentSchoolContext.students || fallbackStudents);
  setupFormSubmission();
  updateSubmitButtonState();
}

function populateTeacherDropdown(teachers) {
  const teacherSelect = document.getElementById('teacher');
  if (!teacherSelect) return;

  teacherSelect.innerHTML =
    '<option value="">-- Select Teacher --</option>' +
    teachers.map((teacher) => `<option value="${teacher.id}">${teacher.name}</option>`).join('');
}

function populateGradeDropdown() {
  const gradeSelect = document.getElementById('grade');
  const sectionSelect = document.getElementById('section');

  if (gradeSelect) {
    gradeSelect.innerHTML =
      '<option value="">-- Select Grade --</option>' +
      Object.keys(gradesData)
        .map((grade) => `<option value="${grade}">${grade}</option>`)
        .join('');

    gradeSelect.addEventListener('change', updateSectionDropdown);
  }

  if (sectionSelect) {
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
  }
}

function populateDateField() {
  const dateInput = document.getElementById('date');
  if (!dateInput) return;

  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
}

function populateRadioAndCheckboxGroups() {
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

  const reasonSelect = document.getElementById('reason');
  if (reasonSelect) {
    reasonSelect.innerHTML =
      '<option value="">-- Select Reason --</option>' +
      reasonsData.map((reason) => `<option value="${reason}">${reason}</option>`).join('');
  }

  const durationContainer = document.getElementById('durationContainer');
  if (durationContainer) {
    durationContainer.innerHTML = [30, 45, 60]
      .map(
        (duration) => `
          <div class="radio-item">
            <input type="radio" id="duration${duration}" name="duration" value="${duration}">
            <label for="duration${duration}">${duration} minutes</label>
          </div>
        `,
      )
      .join('');
  }

  const materialsContainer = document.getElementById('materialsContainer');
  if (materialsContainer) {
    materialsContainer.innerHTML = materialCheckboxes
      .map(
        (material) => `
          <div class="checkbox-item">
            <input type="checkbox" id="material${material.replace(/[^a-zA-Z0-9]/g, '')}" name="materials" value="${material}">
            <label for="material${material.replace(/[^a-zA-Z0-9]/g, '')}">${material}</label>
          </div>
        `,
      )
      .join('');
  }

  const engagementContainer = document.getElementById('engagementContainer');
  if (engagementContainer) {
    engagementContainer.innerHTML = engagementLevels
      .map(
        (engagement) => `
          <div class="radio-item">
            <input type="radio" id="engagement${engagement}" name="engagement" value="${engagement}">
            <label for="engagement${engagement}">${engagement}</label>
          </div>
        `,
      )
      .join('');
  }

  const subjectsContainer = document.getElementById('subjectsContainer');
  if (subjectsContainer) {
    subjectsContainer.innerHTML = subjectsData
      .map((subject) => {
        const slug = subject.replace(/[^a-zA-Z0-9]/g, '');
        return `
          <div class="checkbox-item">
            <input type="checkbox" id="subject${slug}" name="subjects" value="${subject}">
            <label for="subject${slug}">${subject}</label>
          </div>
        `;
      })
      .join('');
  }
}

function populateFocusDropdowns() {
  const literacyFocusSelect = document.getElementById('literacyFocus');
  if (literacyFocusSelect) {
    literacyFocusSelect.innerHTML =
      '<option value="">-- Select Category --</option>' +
      literacyCategories.map((item) => `<option value="${item}">${item}</option>`).join('');
  }

  const numeracyFocusSelect = document.getElementById('numeracyFocus');
  if (numeracyFocusSelect) {
    numeracyFocusSelect.innerHTML =
      '<option value="">-- Select Category --</option>' +
      numeracyCategories.map((item) => `<option value="${item}">${item}</option>`).join('');
  }
}

function setupAttendanceBreakdown(cluster) {
  const breakdownSection = document.getElementById('attendanceBreakdown');
  const totalInput = document.getElementById('studentsPresent');
  const boysInput = document.getElementById('boysPresent');
  const girlsInput = document.getElementById('girlsPresent');
  const supportedClusters = ['Halol', 'Maval'];

  if (!breakdownSection || !totalInput || !boysInput || !girlsInput) {
    return;
  }

  if (!supportedClusters.includes(cluster)) {
    breakdownSection.style.display = 'none';
    boysInput.required = false;
    girlsInput.required = false;
    return;
  }

  totalInput.readOnly = true;

  const syncTotalStudents = () => {
    const boysCount = parseInt(boysInput.value, 10) || 0;
    const girlsCount = parseInt(girlsInput.value, 10) || 0;
    const total = boysCount + girlsCount;
    totalInput.value = total > 0 ? total : '';
  };

  boysInput.addEventListener('input', syncTotalStudents);
  girlsInput.addEventListener('input', syncTotalStudents);
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
    gradesData[selectedGrade].map((section) => `<option value="${section}">${section}</option>`).join('');
}

function updateReasonVisibility() {
  const flnNo = document.getElementById('flnNo')?.checked;
  const reasonSection = document.getElementById('reasonSection');

  if (!reasonSection) return;

  reasonSection.style.display = flnNo ? 'block' : 'none';

  const reasonSelect = document.getElementById('reason');
  if (!flnNo && reasonSelect) {
    reasonSelect.value = '';
    reasonSelect.closest('.form-group').classList.remove('field-error');
    reasonSelect.closest('.form-group').querySelector('.error-message')?.classList.remove('show');
  }
}

function populateStudentTable(students) {
  const tbody = document.querySelector('#studentTable tbody');
  if (!tbody) return;

  tbody.innerHTML = students
    .map(
      (student, index) => `
        <tr data-student-id="${student.id}" data-student-number="${index + 1}">
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
  const tbody = document.querySelector('#studentAttendanceTable tbody');
  if (!tbody) return;

  tbody.innerHTML = students
    .map(
      (student, index) => `
        <tr data-student-id="${student.id}" data-student-number="${index + 1}">
          <td>${student.name}</td>
          <td>
            <div class="attendance-status">
              <button
                type="button"
                class="status-btn status-present"
                data-student="${student.id}"
                data-status="present"
                onclick="selectAttendanceStatus(this)"
              >
                Present
              </button>
              <button
                type="button"
                class="status-btn status-absent"
                data-student="${student.id}"
                data-status="absent"
                onclick="selectAttendanceStatus(this)"
              >
                Absent
              </button>
            </div>
          </td>
        </tr>
      `,
    )
    .join('');
}

function selectPerformanceLevel(btn) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.level-btn').forEach((button) => {
    button.classList.remove('selected');
  });

  btn.classList.add('selected');
  btn.closest('tr')?.classList.remove('field-error');
  updateSubmitButtonState();
}

function selectAttendanceStatus(btn) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.status-btn').forEach((button) => {
    button.classList.remove('selected');
  });

  btn.classList.add('selected');
  btn.closest('tr')?.classList.remove('field-error');
  updateSubmitButtonState();
}

function isFormComplete() {
  const requiredFields = [
    'teacher',
    'grade',
    'section',
    'date',
    'studentsPresent',
    'boysPresent',
    'girlsPresent',
    'mainTopic',
    'literacyFocus',
    'literacyConcept',
    'numeracyFocus',
    'numeracyConcept',
  ];

  for (const fieldName of requiredFields) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field || !field.value.trim()) {
      return false;
    }
  }

  if (!document.querySelector('input[name="flnPeriod"]:checked')) return false;
  if (!document.querySelector('input[name="duration"]:checked')) return false;
  if (!document.querySelector('input[name="engagement"]:checked')) return false;
  if (document.querySelectorAll('input[name="materials"]:checked').length === 0) return false;
  if (document.querySelectorAll('input[name="subjects"]:checked').length === 0) return false;

  if (document.getElementById('flnNo')?.checked) {
    const reasonField = document.getElementById('reason');
    if (!reasonField || !reasonField.value.trim()) {
      return false;
    }
  }

  const boysPresent = parseInt(document.getElementById('boysPresent')?.value || '0', 10);
  const girlsPresent = parseInt(document.getElementById('girlsPresent')?.value || '0', 10);
  const studentsPresent = parseInt(document.getElementById('studentsPresent')?.value || '0', 10);

  if (boysPresent + girlsPresent !== studentsPresent) {
    return false;
  }

  const performanceRows = document.querySelectorAll('#studentTable tbody tr');
  for (const row of performanceRows) {
    if (!row.querySelector('.level-btn.selected')) {
      return false;
    }
  }

  const attendanceRows = document.querySelectorAll('#studentAttendanceTable tbody tr');
  for (const row of attendanceRows) {
    if (!row.querySelector('.status-btn.selected')) {
      return false;
    }
  }

  return true;
}

function updateSubmitButtonState() {
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;

  submitBtn.disabled = !isFormComplete();
}

function showIncompleteFormMessage() {
  const existingMessage = document.getElementById('incompleteFormMessage');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageEl = document.createElement('div');
  messageEl.id = 'incompleteFormMessage';
  messageEl.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: #F44336;
    color: white;
    padding: 14px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
    z-index: 9999;
  `;
  messageEl.textContent = 'Fill all the info to proceed.';
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 2500);
}

function setupFormSubmission() {
  const form = document.getElementById('classProgressForm');
  if (!form) return;

  form.addEventListener('submit', handleFormSubmit);
  form.addEventListener('input', updateSubmitButtonState);
  form.addEventListener('change', updateSubmitButtonState);

  const submitCard = document.getElementById('submitCard');
  if (submitCard) {
    submitCard.addEventListener('click', function () {
      if (!isFormComplete()) {
        showIncompleteFormMessage();
      }
    });
  }
}

function collectStudentPerformance() {
  return Array.from(document.querySelectorAll('#studentTable tbody tr')).map((row) => ({
    studentId: row.dataset.studentId ? parseInt(row.dataset.studentId, 10) : null,
    studentNumber: parseInt(row.dataset.studentNumber, 10),
    name: row.querySelector('td:first-child').textContent.trim(),
    performanceLevel: parseInt(row.querySelector('.level-btn.selected').dataset.level, 10),
    needsSupport: row.querySelector('input[type="checkbox"]').checked,
  }));
}

function collectStudentAttendance() {
  return Array.from(document.querySelectorAll('#studentAttendanceTable tbody tr')).map((row) => ({
    studentId: row.dataset.studentId ? parseInt(row.dataset.studentId, 10) : null,
    studentNumber: parseInt(row.dataset.studentNumber, 10),
    name: row.querySelector('td:first-child').textContent.trim(),
    attendanceStatus: row.querySelector('.status-btn.selected').dataset.status,
  }));
}

function buildFormPayload() {
  const teacherSelect = document.getElementById('teacher');
  return {
    cluster: getUrlParameter('cluster'),
    school: getUrlParameter('school'),
    clusterId: currentSchoolContext?.cluster?.id || null,
    schoolId: currentSchoolContext?.school?.id || null,
    teacherId: teacherSelect.value ? parseInt(teacherSelect.value, 10) : null,
    teacherName: teacherSelect.options[teacherSelect.selectedIndex]?.text || '',
    grade: document.getElementById('grade').value,
    section: document.getElementById('section').value,
    date: document.getElementById('date').value,
    studentsPresent: parseInt(document.getElementById('studentsPresent').value, 10),
    boysPresent: parseInt(document.getElementById('boysPresent').value, 10),
    girlsPresent: parseInt(document.getElementById('girlsPresent').value, 10),
    flnPeriod: document.querySelector('input[name="flnPeriod"]:checked').value,
    reason: document.getElementById('reason').value || null,
    duration: parseInt(document.querySelector('input[name="duration"]:checked').value, 10),
    materials: Array.from(document.querySelectorAll('input[name="materials"]:checked')).map((checkbox) => checkbox.value),
    engagement: document.querySelector('input[name="engagement"]:checked').value,
    subjects: Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map((checkbox) => checkbox.value),
    mainTopic: document.getElementById('mainTopic').value.trim(),
    literacyFocus: document.getElementById('literacyFocus').value,
    literacyConcept: document.getElementById('literacyConcept').value.trim(),
    numeracyFocus: document.getElementById('numeracyFocus').value,
    numeracyConcept: document.getElementById('numeracyConcept').value.trim(),
    remarks: document.getElementById('remarks').value.trim(),
    studentPerformance: collectStudentPerformance(),
    studentAttendance: collectStudentAttendance(),
  };
}

async function handleFormSubmit(event) {
  event.preventDefault();

  let isValid = true;
  const requiredFields = [
    'teacher',
    'grade',
    'section',
    'date',
    'studentsPresent',
    'boysPresent',
    'girlsPresent',
    'flnPeriod',
    'duration',
    'engagement',
    'mainTopic',
    'literacyFocus',
    'literacyConcept',
    'numeracyFocus',
    'numeracyConcept',
  ];

  for (const fieldName of requiredFields) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field && !validateField(field)) {
      isValid = false;
    }
  }

  const boysPresent = parseInt(document.getElementById('boysPresent')?.value || '0', 10);
  const girlsPresent = parseInt(document.getElementById('girlsPresent')?.value || '0', 10);
  const studentsPresent = parseInt(document.getElementById('studentsPresent')?.value || '0', 10);
  if (boysPresent + girlsPresent !== studentsPresent) {
    showError('studentsPresent', 'Total students must match boys present + girls present');
    isValid = false;
  }

  if (document.getElementById('flnNo')?.checked) {
    const reasonField = document.querySelector('[name="reason"]');
    if (reasonField && !validateField(reasonField)) {
      isValid = false;
    }
  }

  if (document.querySelectorAll('input[name="materials"]:checked').length === 0) {
    showError('materials', 'Please select at least one teaching material');
    isValid = false;
  }

  if (document.querySelectorAll('input[name="subjects"]:checked').length === 0) {
    showError('subjects', 'Please select at least one subject');
    isValid = false;
  }

  document.querySelectorAll('#studentTable tbody tr').forEach((row) => {
    if (!row.querySelector('.level-btn.selected')) {
      row.classList.add('field-error');
      isValid = false;
    }
  });

  document.querySelectorAll('#studentAttendanceTable tbody tr').forEach((row) => {
    if (!row.querySelector('.status-btn.selected')) {
      row.classList.add('field-error');
      isValid = false;
    }
  });

  if (!isValid) {
    console.error('Form validation failed. Please check all required fields.');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving to Database...';
  }

  const formData = buildFormPayload();
  console.log('Form Data Submitted:', formData);

  try {
    const payload = await fetchJson(API_ENDPOINTS.saveMonitoring, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    showSuccessMessage(payload.message || 'Form submitted successfully and saved to MySQL.');
    document.getElementById('classProgressForm')?.reset();
    document.querySelectorAll('.selected').forEach((element) => element.classList.remove('selected'));
    updateReasonVisibility();
    populateDateField();
    updateSubmitButtonState();
  } catch (error) {
    console.error('Failed to save monitoring report to database.', error);
    showSuccessMessage(`Database save failed: ${error.message}`, true);
  } finally {
    if (submitBtn) {
      submitBtn.textContent = 'Submit Daily Monitoring Report';
      updateSubmitButtonState();
    }
  }
}

function showSuccessMessage(message, isError = false) {
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${isError ? '#F44336' : '#4CAF50'};
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    max-width: 90%;
    text-align: center;
  `;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 4000);
}

document.addEventListener('DOMContentLoaded', function () {
  const currentPage = document.body.getAttribute('data-page');

  if (currentPage === 'cluster') {
    initClusterPage();
  } else if (currentPage === 'schools') {
    initSchoolsPage().catch((error) => {
      console.error('Failed to initialize schools page.', error);
      renderFatalPageError('Unable to load schools right now.');
    });
  } else if (currentPage === 'class-progress') {
    initClassProgressPage().catch((error) => {
      console.error('Failed to initialize class progress page.', error);
      renderFatalPageError('Unable to open the class progress page right now.');
    });
  }
});
