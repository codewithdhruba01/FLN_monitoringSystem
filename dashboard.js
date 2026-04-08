/**
 * Real-time attendance analytics dashboard injected into the existing UI.
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

const analyticsState = {
    charts: {},
    abortController: null,
    requestId: 0,
    latestPayload: null,
};

const LOW_ATTENDANCE_THRESHOLD = 75;

const barValueLabelsPlugin = {
    id: 'barValueLabels',
    afterDatasetsDraw(chart, args, pluginOptions) {
        if (!chart || chart.config?.type !== 'bar') {
            return;
        }

        const options = pluginOptions || {};
        if (options.display === false) {
            return;
        }

        const ctx = chart.ctx;
        const { chartArea } = chart;
        if (!ctx || !chartArea) {
            return;
        }

        const unit = options.unit ?? '%';
        const fontSize = options.fontSize ?? 12;
        const fontWeight = options.fontWeight ?? '800';
        const formatter = typeof options.formatter === 'function' ? options.formatter : null;
        const minBarSize = options.minBarSize ?? 22;
        const padding = options.padding ?? 3;

        const isHorizontal = (chart.options?.indexAxis || 'x') === 'y';

        ctx.save();
        ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta || meta.hidden) {
                return;
            }

            meta.data.forEach((element, index) => {
                const rawValue = dataset.data?.[index];
                const value = Number(rawValue);
                if (!Number.isFinite(value)) {
                    return;
                }
                if (options.skipZero && value === 0) {
                    return;
                }

                const labelText = formatter
                    ? formatter(value, { chart, dataset, datasetIndex, index })
                    : `${stripTrailingZeros(roundToTwo(value))}${unit}`;

                const bgColor = Array.isArray(dataset.backgroundColor)
                    ? dataset.backgroundColor[index]
                    : dataset.backgroundColor;

                const insideColor = options.color === 'auto' || !options.color
                    ? getContrastingTextColor(bgColor)
                    : options.color;

                let x;
                let y;
                let textAlign = 'center';
                let textBaseline = 'middle';
                let fillStyle = insideColor;
                let strokeStyle = insideColor === '#ffffff' ? '#222222' : '#ffffff';

                if (isHorizontal) {
                    const left = Math.min(element.x, element.base);
                    const right = Math.max(element.x, element.base);
                    const barSize = right - left;
                    const centerX = left + barSize / 2;
                    x = centerX;
                    y = element.y;

                    if (barSize < minBarSize) {
                        x = right + padding + 2;
                        textAlign = 'left';
                        textBaseline = 'middle';
                        fillStyle = '#222222';
                        strokeStyle = '#ffffff';
                    }
                } else {
                    const top = Math.min(element.y, element.base);
                    const bottom = Math.max(element.y, element.base);
                    const barSize = bottom - top;
                    const centerY = top + barSize / 2;
                    x = element.x;
                    y = centerY;

                    if (barSize < minBarSize) {
                        y = top - padding;
                        textAlign = 'center';
                        textBaseline = 'bottom';
                        fillStyle = '#222222';
                        strokeStyle = '#ffffff';
                    }
                }

                const clampedX = clampNumber(x, chartArea.left + 4, chartArea.right - 4);
                const clampedY = clampNumber(y, chartArea.top + 8, chartArea.bottom - 8);

                ctx.textAlign = textAlign;
                ctx.textBaseline = textBaseline;
                ctx.fillStyle = fillStyle;
                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = 3;
                ctx.strokeText(labelText, clampedX, clampedY);
                ctx.fillText(labelText, clampedX, clampedY);
            });
        });

        ctx.restore();
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const elements = getDashboardElements();
    if (!elements.filterForm) {
        return;
    }

    applyChartDefaults();
    prepareDefaultFilters(elements);
    injectAnalyticsPanels(elements);
    renameDashboardCopy(elements);
    bindDashboardEvents(elements);
    loadAnalytics(elements);
});

function getDashboardElements() {
    return {
        filterForm: document.getElementById('filterForm'),
        clusterSelect: document.getElementById('clusterSelect'),
        schoolSelect: document.getElementById('schoolSelect'),
        classSelect: document.getElementById('classSelect'),
        fromDate: document.getElementById('fromDate'),
        toDate: document.getElementById('toDate'),
        exportBtn: document.getElementById('exportBtn'),
        statsGrid: document.querySelector('.stats-grid'),
        mainContainer: document.querySelector('.main-container'),
        dashboardHeader: document.querySelector('.dashboard-header'),
        attendanceCanvas: document.getElementById('attendanceChart'),
        progressCanvas: document.getElementById('progressChart'),
        clusterCanvas: document.getElementById('clusterChart'),
        subjectCanvas: document.getElementById('subjectChart'),
        sectionTitles: Array.from(document.querySelectorAll('.section-title')),
        chartCards: Array.from(document.querySelectorAll('.chart-card')),
    };
}

function applyChartDefaults() {
    if (!window.Chart) {
        return;
    }

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.weight = '600';
    Chart.defaults.color = '#222222';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    try {
        const alreadyRegistered = Chart.registry?.plugins?.get?.(barValueLabelsPlugin.id);
        if (!alreadyRegistered) {
            Chart.register(barValueLabelsPlugin);
        }
    } catch (error) {
        // Fallback: best-effort registration without breaking the dashboard.
        try {
            Chart.register(barValueLabelsPlugin);
        } catch (innerError) {
            // ignore
        }
    }
}

function prepareDefaultFilters(elements) {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 10);

    if (!elements.fromDate.value) {
        elements.fromDate.value = toIsoDate(fromDate);
    }

    if (!elements.toDate.value) {
        elements.toDate.value = toIsoDate(today);
    }
}

function renameDashboardCopy(elements) {
    const statLabels = elements.statsGrid?.querySelectorAll('.stat-label') || [];
    const chartTitles = elements.chartCards.map(card => card.querySelector('h3')).filter(Boolean);

    if (statLabels[0]) statLabels[0].textContent = 'Total Students';
    if (statLabels[1]) statLabels[1].textContent = 'Present Today';
    if (statLabels[2]) statLabels[2].textContent = 'Absent Today';
    if (statLabels[3]) statLabels[3].textContent = 'Low Attendance';

    if (chartTitles[0]) chartTitles[0].textContent = 'Attendance Trend';
    if (chartTitles[1]) chartTitles[1].textContent = 'Present Vs Absent';
    if (chartTitles[2]) chartTitles[2].textContent = 'Student Attendance %';
    if (chartTitles[3]) chartTitles[3].textContent = 'Subject-wise Attendance';

    if (elements.sectionTitles[0]) {
        elements.sectionTitles[0].textContent = 'Attendance Filters';
    }
    if (elements.sectionTitles[1]) {
        elements.sectionTitles[1].textContent = 'Live Analytics';
    }
    if (elements.sectionTitles[2]) {
        elements.sectionTitles[2].textContent = 'Attendance Charts';
    }
}

function injectAnalyticsPanels(elements) {
    if (!elements.statsGrid || document.getElementById('attendanceAnalyticsPanels')) {
        return;
    }

    const panelWrap = document.createElement('div');
    panelWrap.id = 'attendanceAnalyticsPanels';
    panelWrap.style.display = 'grid';
    panelWrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    panelWrap.style.gap = '24px';
    panelWrap.style.margin = '0 0 60px';

    const quickStats = document.createElement('div');
    quickStats.id = 'quickStatsPanel';
    quickStats.style.border = '3px solid #222222';
    quickStats.style.background = '#ffffff';
    quickStats.style.padding = '24px';
    quickStats.style.boxShadow = '8px 8px 0 #222222';

    const quickTitle = document.createElement('h3');
    quickTitle.textContent = 'Quick Stats';
    quickTitle.style.fontSize = '20px';
    quickTitle.style.fontWeight = '800';
    quickTitle.style.textTransform = 'uppercase';
    quickTitle.style.marginBottom = '16px';
    quickStats.appendChild(quickTitle);

    const quickBody = document.createElement('div');
    quickBody.id = 'quickStatsBody';
    quickBody.style.display = 'grid';
    quickBody.style.gap = '12px';
    quickStats.appendChild(quickBody);

    const alerts = document.createElement('div');
    alerts.id = 'lowAttendancePanel';
    alerts.style.border = '3px solid #222222';
    alerts.style.background = '#fff7d6';
    alerts.style.padding = '24px';
    alerts.style.boxShadow = '8px 8px 0 #222222';

    const alertsTitle = document.createElement('h3');
    alertsTitle.textContent = 'Low Attendance Alerts';
    alertsTitle.style.fontSize = '20px';
    alertsTitle.style.fontWeight = '800';
    alertsTitle.style.textTransform = 'uppercase';
    alertsTitle.style.marginBottom = '16px';
    alerts.appendChild(alertsTitle);

    const alertsBody = document.createElement('div');
    alertsBody.id = 'lowAttendanceBody';
    alertsBody.style.display = 'grid';
    alertsBody.style.gap = '10px';
    alerts.appendChild(alertsBody);

    panelWrap.appendChild(quickStats);
    panelWrap.appendChild(alerts);
    elements.statsGrid.insertAdjacentElement('afterend', panelWrap);

    const trendFooter = document.createElement('div');
    trendFooter.id = 'trendSummary';
    trendFooter.style.display = 'grid';
    trendFooter.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
    trendFooter.style.gap = '12px';
    trendFooter.style.marginTop = '8px';
    if (elements.chartCards[0]) {
        elements.chartCards[0].appendChild(trendFooter);
    }

    const refreshBadge = document.createElement('div');
    refreshBadge.id = 'liveRefreshBadge';
    refreshBadge.style.margin = '0 0 24px';
    refreshBadge.style.padding = '14px 18px';
    refreshBadge.style.border = '3px solid #222222';
    refreshBadge.style.background = '#f2efe9';
    refreshBadge.style.boxShadow = '6px 6px 0 #222222';
    refreshBadge.style.fontWeight = '700';
    refreshBadge.textContent = 'Waiting for live analytics...';
    elements.mainContainer.insertBefore(refreshBadge, elements.statsGrid);

    injectStudentSchoolInsights(elements);
}

function bindDashboardEvents(elements) {
    elements.clusterSelect.addEventListener('change', async () => {
        await populateSchools(elements.clusterSelect.value, elements.schoolSelect);
        loadAnalytics(elements);
    });

    [elements.schoolSelect, elements.classSelect, elements.fromDate, elements.toDate].forEach(control => {
        control.addEventListener('change', () => {
            loadAnalytics(elements);
        });
    });

    elements.filterForm.addEventListener('submit', async event => {
        event.preventDefault();
        await exportDashboardAsPdf(elements);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadAnalytics(elements);
        }
    });
}

async function populateSchools(clusterName, schoolSelect) {
    schoolSelect.innerHTML = '<option value="">-- Select School --</option>';
    if (!clusterName) {
        return;
    }

    let schools = [];
    try {
        const response = await fetch(`api/get_schools.php?cluster=${encodeURIComponent(clusterName)}`);
        const payload = await response.json();
        schools = payload.success ? payload.data.schools : [];
    } catch (error) {
        schools = workbookSchoolDirectory[clusterName] || [];
    }

    if (schools.length > 0) {
        schoolSelect.insertAdjacentHTML('beforeend', '<option value="All">All Schools</option>');
    }

    schools.forEach(school => {
        const option = document.createElement('option');
        option.value = school.name;
        option.textContent = school.name;
        schoolSelect.appendChild(option);
    });

    if (!schoolSelect.value && schools.length === 1) {
        schoolSelect.value = schools[0].name;
    }
}

async function loadAnalytics(elements) {
    const params = getFilterParams(elements);
    const badge = document.getElementById('liveRefreshBadge');
    const requestId = ++analyticsState.requestId;

    if (analyticsState.abortController) {
        analyticsState.abortController.abort();
    }

    analyticsState.abortController = new AbortController();
    badge.textContent = 'Refreshing attendance analytics...';

    try {
        const response = await fetch(`api/attendance_analytics.php?${params.toString()}`, {
            signal: analyticsState.abortController.signal,
            cache: 'no-store',
        });
        const payload = await response.json();

        if (requestId !== analyticsState.requestId) {
            return;
        }

        if (!payload.success) {
            throw new Error(payload.message || 'Unable to load attendance analytics.');
        }

        analyticsState.latestPayload = payload.data;
        updateDashboard(payload.data, elements);
        badge.textContent = hasAttendanceData(payload.data)
            ? `Attendance analytics loaded. Last updated ${formatTimestamp(payload.data.generated_at)}.`
            : 'Live sync active, but no attendance records match the current filters yet.';
    } catch (error) {
        if (error.name === 'AbortError') {
            return;
        }

        badge.textContent = `Analytics unavailable: ${error.message}`;
        renderEmptyState(elements, error.message);
    }
}

function getFilterParams(elements) {
    const params = new URLSearchParams();

    if (elements.clusterSelect.value) params.set('cluster', elements.clusterSelect.value);
    if (elements.schoolSelect.value) params.set('school', elements.schoolSelect.value);
    if (elements.classSelect.value) params.set('class', elements.classSelect.value);
    if (elements.fromDate.value) params.set('from_date', elements.fromDate.value);
    if (elements.toDate.value) params.set('to_date', elements.toDate.value);

    return params;
}

function updateDashboard(data, elements) {
    updateStatCards(data);
    updateQuickStats(data);
    updateAlerts(data);
    updateTrendSummary(data);
    renderCharts(data, elements);
    renderStudentSchoolInsights(data);
}

function updateStatCards(data) {
    const cards = document.querySelectorAll('.stat-card');
    const totals = data.totals || {};
    const daily = data.daily_summary || {};
    const quickStats = data.quick_stats || {};

    const values = [
        formatNumber(totals.total_students || 0),
        formatNumber(daily.present || 0),
        formatNumber(daily.absent || 0),
        formatNumber(quickStats.students_below_threshold || 0),
    ];

    cards.forEach((card, index) => {
        const valueNode = card.querySelector('.stat-value');
        if (valueNode) {
            valueNode.textContent = values[index] || '0';
        }

        let meta = card.querySelector('.stat-meta');
        if (!meta) {
            meta = document.createElement('div');
            meta.className = 'stat-meta';
            meta.style.marginTop = '10px';
            meta.style.fontSize = '13px';
            meta.style.fontWeight = '700';
            meta.style.color = '#555555';
            card.appendChild(meta);
        }

        if (index === 0) {
            meta.textContent = `${totals.overall_attendance_percentage || 0}% overall attendance`;
        }
        if (index === 1) {
            meta.textContent = `For ${formatDateLabel(daily.date)}`;
        }
        if (index === 2) {
            meta.textContent = `Daily absence snapshot`;
        }
        if (index === 3) {
            meta.textContent = `Below ${quickStats.threshold_percentage || LOW_ATTENDANCE_THRESHOLD}% threshold`;
        }
    });
}

function updateQuickStats(data) {
    const body = document.getElementById('quickStatsBody');
    if (!body) {
        return;
    }

    const highest = data.quick_stats?.highest_attendance;
    const lowest = data.quick_stats?.lowest_attendance;
    const monthly = data.monthly_trend || [];
    const latestMonth = monthly[monthly.length - 1];

    const entries = [
        {
            label: 'Highest attendance',
            value: highest ? `${highest.student_name} (${highest.attendance_percentage}%)` : 'No data',
        },
        {
            label: 'Lowest attendance',
            value: lowest ? `${lowest.student_name} (${lowest.attendance_percentage}%)` : 'No data',
        },
        {
            label: 'Monthly trend',
            value: latestMonth ? `${latestMonth.label}: ${latestMonth.attendance_rate}%` : 'No data',
        },
        {
            label: 'Overall present',
            value: formatNumber(data.totals?.overall_present || 0),
        },
    ];

    body.innerHTML = '';
    if (!hasAttendanceData(data)) {
        const empty = document.createElement('div');
        empty.textContent = 'No attendance rows were found for the selected cluster, school, class, and date range.';
        empty.style.padding = '14px 16px';
        empty.style.border = '2px solid #222222';
        empty.style.background = '#f2efe9';
        empty.style.fontWeight = '700';
        body.appendChild(empty);
        return;
    }

    entries.forEach(entry => {
        const row = document.createElement('div');
        row.style.padding = '14px 16px';
        row.style.border = '2px solid #222222';
        row.style.background = '#f2efe9';

        const label = document.createElement('div');
        label.textContent = entry.label;
        label.style.fontSize = '12px';
        label.style.fontWeight = '800';
        label.style.textTransform = 'uppercase';
        label.style.color = '#555555';
        label.style.marginBottom = '6px';

        const value = document.createElement('div');
        value.textContent = entry.value;
        value.style.fontSize = '16px';
        value.style.fontWeight = '800';

        row.appendChild(label);
        row.appendChild(value);
        body.appendChild(row);
    });
}

function updateAlerts(data) {
    const body = document.getElementById('lowAttendanceBody');
    if (!body) {
        return;
    }

    const alerts = (data.low_attendance_alerts || []).slice(0, 6);
    body.innerHTML = '';

    if (!hasAttendanceData(data)) {
        const empty = document.createElement('div');
        empty.textContent = 'No matching attendance records are available for the current filters.';
        empty.style.padding = '14px 16px';
        empty.style.border = '2px solid #222222';
        empty.style.background = '#ffffff';
        empty.style.fontWeight = '700';
        body.appendChild(empty);
        return;
    }

    if (alerts.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No students are below the 75% attendance threshold.';
        empty.style.padding = '14px 16px';
        empty.style.border = '2px solid #222222';
        empty.style.background = '#ffffff';
        empty.style.fontWeight = '700';
        body.appendChild(empty);
        return;
    }

    alerts.forEach(student => {
        const item = document.createElement('div');
        item.style.padding = '14px 16px';
        item.style.border = '2px solid #222222';
        item.style.background = '#ffffff';
        item.style.boxShadow = '4px 4px 0 #ff4d4d';

        const title = document.createElement('div');
        title.textContent = student.student_name;
        title.style.fontWeight = '800';
        title.style.marginBottom = '4px';

        const meta = document.createElement('div');
        meta.textContent = `${student.class_name} | ${student.attendance_percentage}% attendance`;
        meta.style.fontWeight = '700';
        meta.style.color = '#b42318';

        item.appendChild(title);
        item.appendChild(meta);
        body.appendChild(item);
    });
}

function updateTrendSummary(data) {
    const container = document.getElementById('trendSummary');
    if (!container) {
        return;
    }

    container.innerHTML = '';
    const items = (data.monthly_trend || []).slice(-3);

    if (items.length === 0) {
        const card = document.createElement('div');
        card.textContent = 'Monthly trend data will appear here.';
        card.style.padding = '12px';
        card.style.border = '2px solid #222222';
        card.style.fontWeight = '700';
        container.appendChild(card);
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.style.padding = '12px';
        card.style.border = '2px solid #222222';
        card.style.background = '#f2efe9';

        const label = document.createElement('div');
        label.textContent = item.label;
        label.style.fontWeight = '800';
        label.style.marginBottom = '4px';

        const value = document.createElement('div');
        value.textContent = `${item.attendance_rate}% attendance`;
        value.style.fontWeight = '700';
        value.style.color = '#555555';

        card.appendChild(label);
        card.appendChild(value);
        container.appendChild(card);
    });
}

function renderCharts(data, elements) {
    renderTrendChart(data.weekly_trend || [], elements.attendanceCanvas);
    renderDailySummaryChart(data.daily_summary || {}, elements.progressCanvas);
    renderStudentAttendanceChart(data.student_wise_attendance || [], elements.clusterCanvas);
    renderSubjectChart(data.subject_wise_attendance || [], elements.subjectCanvas);
}

function injectStudentSchoolInsights(elements) {
    if (!elements.mainContainer || document.getElementById('studentSchoolInsightsSection')) {
        return;
    }

    const section = document.createElement('section');
    section.id = 'studentSchoolInsightsSection';
    section.style.marginBottom = '60px';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'Student & School Breakdown';
    section.appendChild(title);

    const topGrid = document.createElement('div');
    topGrid.style.display = 'grid';
    topGrid.style.gridTemplateColumns = '1.15fr 0.85fr';
    topGrid.style.gap = '24px';
    topGrid.style.marginBottom = '24px';
    topGrid.style.alignItems = 'start';

    const classChartCard = createInsightCard('Class-wise Attendance Comparison');
    const classChartContainer = document.createElement('div');
    classChartContainer.className = 'chart-container';
    const classChartCanvas = document.createElement('canvas');
    classChartCanvas.id = 'classComparisonChart';
    classChartContainer.appendChild(classChartCanvas);
    classChartCard.appendChild(classChartContainer);

    const schoolCard = createInsightCard('School Snapshot');
    const schoolBody = document.createElement('div');
    schoolBody.id = 'schoolSnapshotBody';
    schoolBody.style.display = 'grid';
    schoolBody.style.gap = '12px';
    schoolCard.appendChild(schoolBody);

    topGrid.appendChild(classChartCard);
    topGrid.appendChild(schoolCard);

    const bottomGrid = document.createElement('div');
    bottomGrid.style.display = 'grid';
    bottomGrid.style.gridTemplateColumns = '1fr 1fr';
    bottomGrid.style.gap = '24px';
    bottomGrid.style.alignItems = 'start';

    const classTableCard = createInsightCard('Class Summary Table');
    const classTableWrap = document.createElement('div');
    classTableWrap.id = 'classSummaryTableWrap';
    classTableCard.appendChild(classTableWrap);

    const leaderboardCard = createInsightCard('Student Attendance Leaderboard');
    const leaderboardWrap = document.createElement('div');
    leaderboardWrap.id = 'studentLeaderboardWrap';
    leaderboardCard.appendChild(leaderboardWrap);

    bottomGrid.appendChild(classTableCard);
    bottomGrid.appendChild(leaderboardCard);

    section.appendChild(topGrid);
    section.appendChild(bottomGrid);
    elements.mainContainer.appendChild(section);
}

function createInsightCard(titleText) {
    const card = document.createElement('div');
    card.className = 'chart-card';

    const title = document.createElement('h3');
    title.textContent = titleText;
    card.appendChild(title);

    return card;
}

function renderStudentSchoolInsights(data) {
    const classSummary = buildClassSummary(data.student_wise_attendance || []);
    renderClassComparisonChart(classSummary, document.getElementById('classComparisonChart'));
    renderSchoolSnapshot(data, document.getElementById('schoolSnapshotBody'), classSummary);
    renderClassSummaryTable(classSummary, document.getElementById('classSummaryTableWrap'));
    renderStudentLeaderboard(data.student_wise_attendance || [], document.getElementById('studentLeaderboardWrap'));
}

function renderTrendChart(weeklyTrend, canvas) {
    const labels = weeklyTrend.map(item => item.label);
    const attendanceRates = weeklyTrend.map(item => item.attendance_rate);
    const presentCounts = weeklyTrend.map(item => item.present);

    analyticsState.charts.attendance = createOrUpdateChart(analyticsState.charts.attendance, canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Attendance %',
                    data: attendanceRates,
                    borderColor: '#222222',
                    backgroundColor: 'rgba(252, 185, 0, 0.35)',
                    fill: true,
                    borderWidth: 4,
                    tension: 0.2,
                    pointRadius: 5,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#222222',
                    pointBorderWidth: 3,
                },
                {
                    label: 'Students Present',
                    data: presentCounts,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                    fill: false,
                    borderWidth: 3,
                    tension: 0.2,
                    pointRadius: 4,
                },
            ],
        },
        options: getCartesianChartOptions('Attendance'),
    });
}

function renderDailySummaryChart(dailySummary, canvas) {
    analyticsState.charts.progress = createOrUpdateChart(analyticsState.charts.progress, canvas, {
        type: 'pie',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [
                {
                    data: [dailySummary.present || 0, dailySummary.absent || 0],
                    backgroundColor: ['#4ade80', '#ff4d4d'],
                    borderColor: '#222222',
                    borderWidth: 3,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 18,
                        font: { weight: '700' },
                    },
                },
            },
        },
    });
}

function renderStudentAttendanceChart(students, canvas) {
    const chartData = students.slice(0, 10);
    analyticsState.charts.cluster = createOrUpdateChart(analyticsState.charts.cluster, canvas, {
        type: 'bar',
        data: {
            labels: chartData.map(student => truncate(student.student_name, 12)),
            datasets: [
                {
                    label: 'Attendance %',
                    data: chartData.map(student => student.attendance_percentage),
                    backgroundColor: chartData.map(student =>
                        student.attendance_percentage < LOW_ATTENDANCE_THRESHOLD ? '#ff4d4d' : '#fcb900'
                    ),
                    borderColor: '#222222',
                    borderWidth: 3,
                },
            ],
        },
        options: {
            ...getCartesianChartOptions('Attendance %'),
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { font: { weight: '700' } },
                    grid: { color: '#e0e0e0' },
                },
                y: {
                    ticks: { font: { weight: '700' } },
                    grid: { display: false },
                },
            },
        },
    });
}

function renderSubjectChart(subjects, canvas) {
    const subjectData = subjects.length > 0
        ? subjects
        : [{ subject_name: 'No subject data', attendance_rate: 0 }];

    analyticsState.charts.subject = createOrUpdateChart(analyticsState.charts.subject, canvas, {
        type: 'bar',
        data: {
            labels: subjectData.map(subject => subject.subject_name),
            datasets: [
                {
                    label: 'Attendance %',
                    data: subjectData.map(subject => subject.attendance_rate),
                    backgroundColor: ['#222222', '#fcb900', '#4ade80', '#ff4d4d', '#8b5cf6', '#0ea5e9'],
                    borderColor: '#222222',
                    borderWidth: 2,
                },
            ],
        },
        options: {
            ...getCartesianChartOptions('Attendance %'),
            scales: {
                x: {
                    ticks: { font: { weight: '700' } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { font: { weight: '700' } },
                    grid: { color: '#e0e0e0' },
                },
            },
        },
    });
}

function buildClassSummary(students) {
    const summary = new Map();

    students.forEach(student => {
        const className = student.class_name || 'Unassigned';
        if (!summary.has(className)) {
            summary.set(className, {
                class_name: className,
                student_count: 0,
                present_count: 0,
                absent_count: 0,
                attendance_rate: 0,
            });
        }

        const row = summary.get(className);
        row.student_count += 1;
        row.present_count += Number(student.present_count || 0);
        row.absent_count += Number(student.absent_count || 0);
    });

    return Array.from(summary.values())
        .map(item => {
            const totalMarks = item.present_count + item.absent_count;
            return {
                ...item,
                attendance_rate: totalMarks > 0 ? roundToTwo((item.present_count / totalMarks) * 100) : 0,
            };
        })
        .sort((left, right) => getClassSortValue(left.class_name) - getClassSortValue(right.class_name));
}

function renderClassComparisonChart(classSummary, canvas) {
    const chartData = classSummary.length > 0 ? classSummary : [{ class_name: 'No Data', attendance_rate: 0 }];

    analyticsState.charts.classComparison = createOrUpdateChart(analyticsState.charts.classComparison, canvas, {
        type: 'bar',
        data: {
            labels: chartData.map(item => item.class_name),
            datasets: [
                {
                    label: 'Attendance %',
                    data: chartData.map(item => item.attendance_rate),
                    backgroundColor: chartData.map(item =>
                        item.attendance_rate < LOW_ATTENDANCE_THRESHOLD ? '#ffb4b4' : '#fcb900'
                    ),
                    borderColor: '#222222',
                    borderWidth: 3,
                },
            ],
        },
        options: {
            ...getCartesianChartOptions('Attendance %'),
            plugins: {
                ...getCartesianChartOptions('Attendance %').plugins,
                legend: { display: false },
            },
            scales: {
                x: {
                    ticks: { font: { weight: '700' } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { font: { weight: '700' } },
                    title: {
                        display: true,
                        text: 'Attendance %',
                        font: { weight: '800' },
                    },
                    grid: { color: '#e0e0e0', borderColor: '#222222' },
                },
            },
        },
    });
}

function renderSchoolSnapshot(data, container, classSummary) {
    if (!container) {
        return;
    }

    const filters = data.filters || {};
    const totals = data.totals || {};
    const daily = data.daily_summary || {};
    const lowAttendanceCount = data.quick_stats?.students_below_threshold || 0;
    const activeClasses = classSummary.length;

    const entries = [
        { label: 'Cluster', value: filters.cluster || 'All clusters' },
        { label: 'School', value: filters.school || 'All schools' },
        { label: 'Class scope', value: filters.class_name || 'All classes' },
        { label: 'Date range', value: `${formatDateLabel(filters.from_date)} to ${formatDateLabel(filters.to_date)}` },
        { label: 'Students tracked', value: formatNumber(totals.total_students || 0) },
        { label: 'Active classes', value: formatNumber(activeClasses) },
        { label: 'Today present', value: formatNumber(daily.present || 0) },
        { label: 'Students below 75%', value: formatNumber(lowAttendanceCount) },
    ];

    container.innerHTML = '';
    entries.forEach(entry => {
        const row = document.createElement('div');
        row.style.padding = '14px 16px';
        row.style.border = '2px solid #222222';
        row.style.background = '#f2efe9';

        const label = document.createElement('div');
        label.textContent = entry.label;
        label.style.fontSize = '12px';
        label.style.fontWeight = '800';
        label.style.textTransform = 'uppercase';
        label.style.color = '#555555';
        label.style.marginBottom = '6px';

        const value = document.createElement('div');
        value.textContent = entry.value;
        value.style.fontSize = '16px';
        value.style.fontWeight = '800';

        row.appendChild(label);
        row.appendChild(value);
        container.appendChild(row);
    });
}

function renderClassSummaryTable(classSummary, container) {
    if (!container) {
        return;
    }

    if (classSummary.length === 0) {
        container.innerHTML = buildEmptyInsightState('Class-wise school summary will appear here.');
        return;
    }

    container.innerHTML = `
        <div style="overflow-x:auto;border:2px solid #222222;">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#222222;color:#ffffff;">
                        <th style="padding:14px;text-align:left;">Class</th>
                        <th style="padding:14px;text-align:left;">Students</th>
                        <th style="padding:14px;text-align:left;">Present</th>
                        <th style="padding:14px;text-align:left;">Absent</th>
                        <th style="padding:14px;text-align:left;">Attendance %</th>
                    </tr>
                </thead>
                <tbody>
                    ${classSummary.map(item => `
                        <tr>
                            <td style="padding:14px;border-top:2px solid #222222;font-weight:800;">${escapeHtml(item.class_name)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;">${formatNumber(item.student_count)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;">${formatNumber(item.present_count)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;">${formatNumber(item.absent_count)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;font-weight:800;">${item.attendance_rate}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderStudentLeaderboard(students, container) {
    if (!container) {
        return;
    }

    const ranked = [...students]
        .filter(student => Number(student.present_count || 0) + Number(student.absent_count || 0) > 0)
        .sort((left, right) =>
            Number(right.attendance_percentage || 0) - Number(left.attendance_percentage || 0)
            || String(left.student_name).localeCompare(String(right.student_name))
        )
        .slice(0, 8);

    if (ranked.length === 0) {
        container.innerHTML = buildEmptyInsightState('Student leaderboard will appear here once attendance is available.');
        return;
    }

    container.innerHTML = `
        <div style="overflow-x:auto;border:2px solid #222222;">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#222222;color:#ffffff;">
                        <th style="padding:14px;text-align:left;">Student</th>
                        <th style="padding:14px;text-align:left;">Class</th>
                        <th style="padding:14px;text-align:left;">Present</th>
                        <th style="padding:14px;text-align:left;">Absent</th>
                        <th style="padding:14px;text-align:left;">Attendance %</th>
                    </tr>
                </thead>
                <tbody>
                    ${ranked.map(student => `
                        <tr>
                            <td style="padding:14px;border-top:2px solid #222222;font-weight:800;">${escapeHtml(student.student_name)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;">${escapeHtml(student.class_name || 'Unassigned')}</td>
                            <td style="padding:14px;border-top:2px solid #222222;">${formatNumber(student.present_count || 0)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;">${formatNumber(student.absent_count || 0)}</td>
                            <td style="padding:14px;border-top:2px solid #222222;font-weight:800;">${Number(student.attendance_percentage || 0)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function buildEmptyInsightState(message) {
    return `<div style="padding:14px 16px;border:2px solid #222222;background:#f2efe9;font-weight:700;">${escapeHtml(message)}</div>`;
}

function createOrUpdateChart(existingChart, canvas, config) {
    if (!canvas || !window.Chart) {
        return existingChart;
    }

    if (existingChart) {
        existingChart.data = config.data;
        existingChart.options = config.options;
        existingChart.config.type = config.type;
        existingChart.update();
        return existingChart;
    }

    return new Chart(canvas.getContext('2d'), config);
}

function getCartesianChartOptions(axisLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            barValueLabels: {
                display: true,
                unit: '%',
                color: 'auto',
                skipZero: true,
            },
            legend: {
                position: 'bottom',
                labels: {
                    padding: 18,
                    font: { weight: '700' },
                },
            },
            tooltip: {
                backgroundColor: '#222222',
                padding: 12,
                titleFont: { size: 14, weight: '800' },
                bodyFont: { size: 13, weight: '700' },
            },
        },
        scales: {
            x: {
                ticks: { font: { weight: '700' } },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: { font: { weight: '700' } },
                title: {
                    display: true,
                    text: axisLabel,
                    font: { weight: '800' },
                },
                grid: {
                    color: '#e0e0e0',
                    borderColor: '#222222',
                },
            },
        },
    };
}

function clampNumber(value, minValue, maxValue) {
    if (Number.isNaN(value)) {
        return minValue;
    }
    return Math.min(maxValue, Math.max(minValue, value));
}

function getContrastingTextColor(color) {
    const rgb = parseColorToRgb(color);
    if (!rgb) {
        return '#222222';
    }

    // Relative luminance (sRGB).
    const toLinear = channel => {
        const normalized = channel / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };

    const r = toLinear(rgb.r);
    const g = toLinear(rgb.g);
    const b = toLinear(rgb.b);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance > 0.62 ? '#222222' : '#ffffff';
}

function parseColorToRgb(color) {
    if (!color || typeof color !== 'string') {
        return null;
    }

    const value = color.trim();
    const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        const hex = hexMatch[1];
        const expanded = hex.length === 3
            ? hex.split('').map(ch => ch + ch).join('')
            : hex;

        const r = parseInt(expanded.slice(0, 2), 16);
        const g = parseInt(expanded.slice(2, 4), 16);
        const b = parseInt(expanded.slice(4, 6), 16);
        return { r, g, b };
    }

    const rgbMatch = value.match(/^rgba?\((.+)\)$/i);
    if (!rgbMatch) {
        return null;
    }

    const parts = rgbMatch[1].split(',').map(part => part.trim());
    if (parts.length < 3) {
        return null;
    }

    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    if (![r, g, b].every(Number.isFinite)) {
        return null;
    }

    return {
        r: clampNumber(r, 0, 255),
        g: clampNumber(g, 0, 255),
        b: clampNumber(b, 0, 255),
    };
}

function renderEmptyState(elements, message) {
    updateStatCards({
        totals: { total_students: 0, overall_attendance_percentage: 0 },
        daily_summary: { date: elements.toDate.value, present: 0, absent: 0 },
        quick_stats: { students_below_threshold: 0, threshold_percentage: LOW_ATTENDANCE_THRESHOLD },
    });
    updateQuickStats({ totals: { overall_present: 0 }, monthly_trend: [], quick_stats: {} });
    updateAlerts({ low_attendance_alerts: [] });
    updateTrendSummary({ monthly_trend: [] });
    renderCharts(
        {
            weekly_trend: [],
            daily_summary: {},
            student_wise_attendance: [],
            subject_wise_attendance: [],
        },
        elements
    );
    renderStudentSchoolInsights({
        filters: {},
        totals: {},
        daily_summary: {},
        quick_stats: {},
        student_wise_attendance: [],
    });

    const quickBody = document.getElementById('quickStatsBody');
    if (quickBody) {
        quickBody.innerHTML = `<div style="padding:14px 16px;border:2px solid #222222;background:#f2efe9;font-weight:700;">${escapeHtml(message)}</div>`;
    }
}

function hasAttendanceData(data) {
    return Number(data?.totals?.overall_present || 0) + Number(data?.totals?.overall_absent || 0) > 0;
}

async function exportDashboardAsPdf(elements) {
    const exportButton = elements.exportBtn;
    exportButton.disabled = true;
    exportButton.style.opacity = '0.7';
    exportButton.textContent = 'Opening PDF...';

    try {
        const params = getFilterParams(elements);
        const exportUrl = `api/export_attendance_pdf.php?${params.toString()}`;
        window.open(exportUrl, '_blank', 'noopener');
    } catch (error) {
        window.alert(`Unable to export PDF: ${error.message}`);
    } finally {
        exportButton.disabled = false;
        exportButton.style.opacity = '1';
        exportButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export PDF
        `;
    }
}

function ensureScriptLoaded(src, globalKey) {
    if (window[globalKey]) {
        return Promise.resolve();
    }

    const existing = Array.from(document.querySelectorAll('script')).find(script => script.src === src);
    if (existing) {
        return new Promise((resolve, reject) => {
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

function formatTimestamp(isoTimestamp) {
    const date = new Date(isoTimestamp);
    return date.toLocaleString();
}

function formatDateLabel(dateString) {
    if (!dateString) {
        return 'today';
    }

    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function toIsoDate(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

function truncate(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1)}...`;
}

function getClassSortValue(className) {
    const match = String(className || '').match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function roundToTwo(value) {
    return Math.round(value * 100) / 100;
}

function stripTrailingZeros(value) {
    if (!Number.isFinite(value)) {
        return String(value);
    }

    return value.toFixed(2).replace(/\.?0+$/, '');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatNumber(value) {
    return new Intl.NumberFormat().format(value);
}
