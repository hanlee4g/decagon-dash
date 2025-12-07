// Week Analytics Dashboard - Main Application

class AnalyticsDashboard {
    constructor() {
        this.rawData = [];
        this.filteredData = [];
        this.userContactCounts = {};
        this.charts = {};
        // Y-axis zoom/pan state for charts
        this.chartYAxisState = {
            escalationChart: {
                min: 0,
                max: 100,
                defaultMin: 0,
                defaultMax: 100
            },
            csatChart: {
                min: 0,
                max: 5,
                defaultMin: 0,
                defaultMax: 5
            }
        };
        // Track drag state for y-axis panning
        this.dragState = {
            isDragging: false,
            chartId: null,
            startY: 0,
            startMin: 0,
            startMax: 0
        };
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.populateDynamicFilters();
        this.applyFilters();
    }

    async loadData() {
        return new Promise((resolve, reject) => {
            Papa.parse('Case_Study_Data.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.rawData = results.data.map(row => ({
                        ...row,
                        parsedDate: this.parseDate(row.created_at),
                        week: this.getWeekKey(this.parseDate(row.created_at))
                    }));
                    
                    // Calculate user contact counts
                    this.calculateUserContactCounts();
                    
                    // Set date range
                    this.setDateRangeBounds();
                    
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('dashboard').style.display = 'flex';
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading CSV:', error);
                    reject(error);
                }
            });
        });
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        // Format: "Friday, August 2, 2024"
        const cleaned = dateStr.replace(/"/g, '');
        const date = new Date(cleaned);
        return isNaN(date.getTime()) ? null : date;
    }

    getWeekKey(date) {
        if (!date) return null;
        // Get the Monday of the week
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d.toISOString().split('T')[0];
    }

    getWeekLabel(weekKey) {
        if (!weekKey) return 'Unknown';
        const date = new Date(weekKey);
        const options = { month: 'short', day: 'numeric' };
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);
        return `${date.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    }

    calculateUserContactCounts() {
        this.userContactCounts = {};
        this.rawData.forEach(row => {
            if (row.userId) {
                this.userContactCounts[row.userId] = (this.userContactCounts[row.userId] || 0) + 1;
            }
        });
    }

    setDateRangeBounds() {
        const dates = this.rawData
            .map(r => r.parsedDate)
            .filter(d => d)
            .sort((a, b) => a - b);
        
        if (dates.length > 0) {
            const minDate = dates[0].toISOString().split('T')[0];
            const maxDate = dates[dates.length - 1].toISOString().split('T')[0];
            
            document.getElementById('startDate').value = minDate;
            document.getElementById('startDate').min = minDate;
            document.getElementById('startDate').max = maxDate;
            
            document.getElementById('endDate').value = maxDate;
            document.getElementById('endDate').min = minDate;
            document.getElementById('endDate').max = maxDate;
        }
    }

    populateDynamicFilters() {
        // Populate Decagon Languages
        const decagonLanguages = [...new Set(this.rawData
            .map(r => r.decagonlanguage)
            .filter(v => v)
        )].sort();
        
        const decagonLangSelect = document.getElementById('decagonLanguageFilter');
        decagonLangSelect.innerHTML = decagonLanguages
            .map(lang => `<option value="${lang}" selected>${lang}</option>`)
            .join('');

        // Populate Languages
        const languages = [...new Set(this.rawData
            .map(r => r.language)
            .filter(v => v)
        )].sort();
        
        const langSelect = document.getElementById('languageFilter');
        langSelect.innerHTML = languages
            .map(lang => `<option value="${lang}" selected>${lang}</option>`)
            .join('');
    }

    setupEventListeners() {
        // Apply filters button
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Reset filters button
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Export data button
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportFilteredData();
        });

        // Chart export buttons
        document.querySelectorAll('.chart-export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const chartId = btn.dataset.chart;
                this.exportChart(chartId);
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target) &&
                sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });

        // Auto-apply on filter change (optional - currently using button)
        // Could enable this for instant feedback
    }

    getFilterValues() {
        return {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            escalated: document.getElementById('escalatedFilter').value,
            repeatContactsMin: document.getElementById('repeatContactsMin').value,
            repeatContactsMax: document.getElementById('repeatContactsMax').value,
            csatExists: document.getElementById('csatExistsFilter').value,
            csatScores: [...document.querySelectorAll('#csatScoreFilter input:checked')].map(i => i.value),
            decagonLanguageExists: document.getElementById('decagonLanguageExistsFilter').value,
            decagonLanguages: [...document.getElementById('decagonLanguageFilter').selectedOptions].map(o => o.value),
            rtrFlagged: document.getElementById('rtrFlaggedFilter').value,
            sandbox: document.getElementById('sandboxFilter').value,
            userDevice: document.getElementById('userDeviceFilter').value,
            feeBlockState: document.getElementById('feeBlockStateFilter').value,
            isTrial: document.getElementById('isTrialFilter').value,
            languageExists: document.getElementById('languageExistsFilter').value,
            languages: [...document.getElementById('languageFilter').selectedOptions].map(o => o.value),
            adminPortal: document.getElementById('adminPortalFilter').value
        };
    }

    applyFilters() {
        const filters = this.getFilterValues();
        this.filteredData = this.rawData.filter(row => {
            // Date range filter - use local midnight for comparison
            if (filters.startDate && row.parsedDate) {
                const [year, month, day] = filters.startDate.split('-').map(Number);
                const start = new Date(year, month - 1, day, 0, 0, 0, 0);
                if (row.parsedDate < start) return false;
            }
            if (filters.endDate && row.parsedDate) {
                const [year, month, day] = filters.endDate.split('-').map(Number);
                const end = new Date(year, month - 1, day, 23, 59, 59, 999);
                if (row.parsedDate > end) return false;
            }

            // Escalated filter
            if (filters.escalated !== 'all' && row.escalated !== filters.escalated) {
                return false;
            }

            // Repeat contacts filter
            if (row.userId) {
                const contactCount = this.userContactCounts[row.userId] || 0;
                if (filters.repeatContactsMin && contactCount < parseInt(filters.repeatContactsMin)) {
                    return false;
                }
                if (filters.repeatContactsMax && contactCount > parseInt(filters.repeatContactsMax)) {
                    return false;
                }
            }

            // CSAT exists filter
            if (filters.csatExists === 'exists' && !row.csat) return false;
            if (filters.csatExists === 'not_exists' && row.csat) return false;

            // CSAT score filter (only applies when CSAT exists)
            if (row.csat && filters.csatScores.length > 0 && !filters.csatScores.includes(row.csat)) {
                return false;
            }

            // Decagon Language exists filter
            if (filters.decagonLanguageExists === 'exists' && !row.decagonlanguage) return false;
            if (filters.decagonLanguageExists === 'not_exists' && row.decagonlanguage) return false;

            // Decagon Language specific filter
            if (row.decagonlanguage && filters.decagonLanguages.length > 0 && 
                !filters.decagonLanguages.includes(row.decagonlanguage)) {
                return false;
            }

            // RTR Flagged filter
            if (!this.applyExistsFilter(row.is_post_signup_rtr_flagged, filters.rtrFlagged)) {
                return false;
            }

            // Sandbox filter
            if (!this.applyExistsFilter(row.sandbox, filters.sandbox)) {
                return false;
            }

            // User device filter
            if (filters.userDevice !== 'all' && row.user_device !== filters.userDevice) {
                return false;
            }

            // Fee block state filter
            if (!this.applyExistsFilter(row.user_fee_block_state, filters.feeBlockState)) {
                return false;
            }

            // Is trial filter
            if (!this.applyExistsFilter(row.is_trial, filters.isTrial)) {
                return false;
            }

            // Language exists filter
            if (filters.languageExists === 'exists' && !row.language) return false;
            if (filters.languageExists === 'not_exists' && row.language) return false;

            // Language specific filter
            if (row.language && filters.languages.length > 0 && 
                !filters.languages.includes(row.language)) {
                return false;
            }

            // Admin portal filter
            if (!this.applyExistsFilter(row.isdecagon_admin_portal, filters.adminPortal)) {
                return false;
            }

            return true;
        });

        this.updateDashboard();
    }

    applyExistsFilter(value, filterValue) {
        if (filterValue === 'all') return true;
        if (filterValue === 'exists') return !!value;
        if (filterValue === 'not_exists') return !value;
        return value === filterValue;
    }

    resetFilters() {
        // Reset date range
        this.setDateRangeBounds();

        // Reset all selects to first option
        document.querySelectorAll('.filter-section select').forEach(select => {
            if (select.multiple) {
                [...select.options].forEach(opt => opt.selected = true);
            } else {
                select.selectedIndex = 0;
            }
        });

        // Reset number inputs
        document.getElementById('repeatContactsMin').value = '';
        document.getElementById('repeatContactsMax').value = '';

        // Check all CSAT checkboxes
        document.querySelectorAll('#csatScoreFilter input').forEach(input => {
            input.checked = true;
        });

        this.applyFilters();
    }

    updateDashboard() {
        const weeklyData = this.calculateWeeklyMetrics();
        this.updateSummaryCards(weeklyData);
        this.updateCharts(weeklyData);
        this.updateTable(weeklyData);
    }

    calculateWeeklyMetrics() {
        const weekGroups = {};
        
        this.filteredData.forEach(row => {
            if (!row.week) return;
            
            if (!weekGroups[row.week]) {
                weekGroups[row.week] = {
                    week: row.week,
                    total: 0,
                    escalated: 0,
                    csatSum: 0,
                    csatCount: 0
                };
            }
            
            weekGroups[row.week].total++;
            
            if (row.escalated === 'Yes') {
                weekGroups[row.week].escalated++;
            }
            
            if (row.csat && !isNaN(parseInt(row.csat))) {
                weekGroups[row.week].csatSum += parseInt(row.csat);
                weekGroups[row.week].csatCount++;
            }
        });

        // Convert to sorted array and calculate metrics
        const weeks = Object.values(weekGroups)
            .sort((a, b) => a.week.localeCompare(b.week))
            .map((week, index, arr) => {
                const escalationRate = week.total > 0 
                    ? (week.escalated / week.total) * 100 
                    : 0;
                const csatAverage = week.csatCount > 0 
                    ? week.csatSum / week.csatCount 
                    : null;

                // Calculate trends
                let escalationTrend = null;
                let csatTrend = null;

                if (index > 0) {
                    const prevWeek = arr[index - 1];
                    const prevEscalationRate = prevWeek.total > 0 
                        ? (prevWeek.escalated / prevWeek.total) * 100 
                        : 0;
                    const prevCsatAverage = prevWeek.csatCount > 0 
                        ? prevWeek.csatSum / prevWeek.csatCount 
                        : null;

                    if (prevEscalationRate > 0) {
                        escalationTrend = ((escalationRate - prevEscalationRate) / prevEscalationRate) * 100;
                    }

                    if (prevCsatAverage !== null && csatAverage !== null) {
                        csatTrend = ((csatAverage - prevCsatAverage) / prevCsatAverage) * 100;
                    }
                }

                return {
                    ...week,
                    escalationRate,
                    csatAverage,
                    escalationTrend,
                    csatTrend,
                    label: this.getWeekLabel(week.week)
                };
            });

        return weeks;
    }

    updateSummaryCards(weeklyData) {
        const totalRecords = this.filteredData.length;
        
        const csatValues = this.filteredData
            .map(r => r.csat)
            .filter(v => v && !isNaN(parseInt(v)))
            .map(v => parseInt(v));

        document.getElementById('totalRecords').textContent = totalRecords.toLocaleString();
        document.getElementById('csatResponses').textContent = csatValues.length.toLocaleString();
    }

    updateCharts(weeklyData) {
        const labels = weeklyData.map(w => w.label);
        const escalationState = this.chartYAxisState.escalationChart;
        const csatState = this.chartYAxisState.csatChart;
        
        // Escalation Rate Chart
        this.renderChart('escalationChart', {
            labels,
            datasets: [{
                label: 'Escalation Rate (%)',
                data: weeklyData.map(w => w.escalationRate),
                borderColor: '#0a84ff',
                backgroundColor: 'rgba(10, 132, 255, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#0a84ff',
                pointBorderColor: '#0a84ff',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        }, {
            scales: {
                y: {
                    min: escalationState.min,
                    max: escalationState.max,
                    ticks: {
                        stepSize: 20,
                        callback: (value) => value + '%',
                        color: '#6e6e73'
                    },
                    grid: {
                        color: 'rgba(42, 42, 46, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#6e6e73'
                    },
                    grid: {
                        color: 'rgba(42, 42, 46, 0.5)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `Escalation Rate: ${context.raw.toFixed(2)}%`
                    }
                }
            }
        });

        // CSAT Chart
        this.renderChart('csatChart', {
            labels,
            datasets: [{
                label: 'Average CSAT',
                data: weeklyData.map(w => w.csatAverage),
                borderColor: '#30d158',
                backgroundColor: 'rgba(48, 209, 88, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#30d158',
                pointBorderColor: '#30d158',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        }, {
            scales: {
                y: {
                    min: csatState.min,
                    max: csatState.max,
                    ticks: {
                        stepSize: csatState.max <= 1 ? 0.1 : (csatState.max <= 2 ? 0.25 : 1),
                        color: '#6e6e73'
                    },
                    grid: {
                        color: 'rgba(42, 42, 46, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: '#6e6e73'
                    },
                    grid: {
                        color: 'rgba(42, 42, 46, 0.5)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => context.raw !== null 
                            ? `Avg CSAT: ${context.raw.toFixed(2)}` 
                            : 'No data'
                    }
                }
            }
        });

        // Setup chart interaction handlers (only once)
        this.setupChartInteractions();
    }

    renderChart(canvasId, data, additionalOptions = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    ...additionalOptions.plugins
                },
                scales: additionalOptions.scales
            }
        });
    }

    setupChartInteractions() {
        // Only setup once
        if (this.chartInteractionsSetup) return;
        this.chartInteractionsSetup = true;

        const chartConfigs = [
            { id: 'escalationChart', stateKey: 'escalationChart' },
            { id: 'csatChart', stateKey: 'csatChart' }
        ];

        chartConfigs.forEach(({ id, stateKey }) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;

            // Wheel zoom handler
            canvas.addEventListener('wheel', (e) => {
                const chart = this.charts[id];
                if (!chart) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                
                // Check if mouse is over y-axis area (left ~60px)
                const chartArea = chart.chartArea;
                if (x > chartArea.left) return; // Not on y-axis

                e.preventDefault();

                const state = this.chartYAxisState[stateKey];
                const range = state.max - state.min;
                const zoomFactor = 0.1;
                const delta = e.deltaY > 0 ? 1 : -1; // Scroll down = zoom out, up = zoom in

                if (delta > 0) {
                    // Zoom out - expand range
                    const expandAmount = range * zoomFactor;
                    state.min = Math.max(state.defaultMin, state.min - expandAmount / 2);
                    state.max = Math.min(state.defaultMax, state.max + expandAmount / 2);
                } else {
                    // Zoom in - shrink range (minimum range to prevent over-zoom)
                    const minRange = (state.defaultMax - state.defaultMin) * 0.05;
                    if (range > minRange) {
                        const shrinkAmount = range * zoomFactor;
                        state.min = state.min + shrinkAmount / 2;
                        state.max = state.max - shrinkAmount / 2;
                    }
                }

                // Escalation chart: round to whole percentages
                if (stateKey === 'escalationChart') {
                    state.min = Math.floor(state.min);
                    state.max = Math.ceil(state.max);
                    // Ensure at least 1% range
                    if (state.max - state.min < 1) {
                        state.max = state.min + 1;
                    }
                }

                this.updateChartYAxis(id, stateKey);
            }, { passive: false });

            // Drag pan handlers
            canvas.addEventListener('mousedown', (e) => {
                const chart = this.charts[id];
                if (!chart) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                
                // Check if mouse is over y-axis area
                const chartArea = chart.chartArea;
                if (x > chartArea.left) return; // Not on y-axis

                const state = this.chartYAxisState[stateKey];
                this.dragState = {
                    isDragging: true,
                    chartId: id,
                    stateKey: stateKey,
                    startY: e.clientY,
                    startMin: state.min,
                    startMax: state.max
                };

                canvas.style.cursor = 'ns-resize';
            });
        });

        // Global mouse move and up handlers for drag
        document.addEventListener('mousemove', (e) => {
            if (!this.dragState.isDragging) return;

            const { chartId, stateKey, startY, startMin, startMax } = this.dragState;
            const chart = this.charts[chartId];
            if (!chart) return;

            const state = this.chartYAxisState[stateKey];
            const canvas = document.getElementById(chartId);
            const rect = canvas.getBoundingClientRect();
            const chartArea = chart.chartArea;
            const chartHeight = chartArea.bottom - chartArea.top;

            // Calculate drag distance and convert to value change
            const deltaY = e.clientY - startY;
            const range = startMax - startMin;
            const valueChange = (deltaY / chartHeight) * range;

            // Apply pan (shift both min and max)
            let newMin = startMin + valueChange;
            let newMax = startMax + valueChange;

            // Clamp to default bounds
            if (newMin < state.defaultMin) {
                newMax += (state.defaultMin - newMin);
                newMin = state.defaultMin;
            }
            if (newMax > state.defaultMax) {
                newMin -= (newMax - state.defaultMax);
                newMax = state.defaultMax;
            }

            // Final clamp
            state.min = Math.max(state.defaultMin, newMin);
            state.max = Math.min(state.defaultMax, newMax);

            // Escalation chart: round to whole percentages
            if (stateKey === 'escalationChart') {
                state.min = Math.floor(state.min);
                state.max = Math.ceil(state.max);
            }

            this.updateChartYAxis(chartId, stateKey);
        });

        document.addEventListener('mouseup', () => {
            if (this.dragState.isDragging) {
                const canvas = document.getElementById(this.dragState.chartId);
                if (canvas) canvas.style.cursor = '';
                this.dragState.isDragging = false;
            }
        });
    }

    updateChartYAxis(chartId, stateKey) {
        const chart = this.charts[chartId];
        if (!chart) return;

        const state = this.chartYAxisState[stateKey];
        chart.options.scales.y.min = state.min;
        chart.options.scales.y.max = state.max;

        // Update step size based on zoom level
        if (stateKey === 'csatChart') {
            const range = state.max - state.min;
            if (range <= 1) {
                chart.options.scales.y.ticks.stepSize = 0.1;
            } else if (range <= 2) {
                chart.options.scales.y.ticks.stepSize = 0.25;
            } else {
                chart.options.scales.y.ticks.stepSize = 1;
            }
        } else if (stateKey === 'escalationChart') {
            // Escalation chart: always use whole number steps
            const range = state.max - state.min;
            if (range <= 10) {
                chart.options.scales.y.ticks.stepSize = 1;
            } else if (range <= 25) {
                chart.options.scales.y.ticks.stepSize = 5;
            } else if (range <= 50) {
                chart.options.scales.y.ticks.stepSize = 10;
            } else {
                chart.options.scales.y.ticks.stepSize = 20;
            }
        }

        chart.update('none'); // 'none' mode prevents animation for smoother interaction
    }

    updateTable(weeklyData) {
        const tbody = document.getElementById('weeklyTableBody');
        
        tbody.innerHTML = weeklyData.map(week => `
            <tr>
                <td>${week.label}</td>
                <td>${week.total.toLocaleString()}</td>
                <td>${week.escalated.toLocaleString()}</td>
                <td>${week.escalationRate.toFixed(2)}%</td>
                <td>${this.formatTrendBadge(week.escalationTrend, true)}</td>
                <td>${week.csatCount.toLocaleString()}</td>
                <td>${week.csatAverage !== null ? week.csatAverage.toFixed(2) : '-'}</td>
                <td>${this.formatTrendBadge(week.csatTrend, false)}</td>
            </tr>
        `).join('');
    }

    formatTrendBadge(value, inversePositive = false) {
        if (value === null || isNaN(value)) {
            return '<span class="trend-badge neutral">-</span>';
        }

        const isPositive = inversePositive ? value < 0 : value > 0;
        const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
        const className = value === 0 ? 'neutral' : (isPositive ? 'positive' : 'negative');
        
        return `<span class="trend-badge ${className}">${arrow} ${Math.abs(value).toFixed(1)}%</span>`;
    }

    exportChart(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return;

        const link = document.createElement('a');
        link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = chart.toBase64Image();
        link.click();
    }

    exportFilteredData() {
        const weeklyData = this.calculateWeeklyMetrics();
        
        const csvContent = [
            ['Week', 'Total Records', 'Escalated', 'Escalation Rate (%)', 'Rate Trend (%)', 
             'CSAT Responses', 'Avg CSAT', 'CSAT Trend (%)'].join(','),
            ...weeklyData.map(week => [
                week.label,
                week.total,
                week.escalated,
                week.escalationRate.toFixed(2),
                week.escalationTrend !== null ? week.escalationTrend.toFixed(2) : '',
                week.csatCount,
                week.csatAverage !== null ? week.csatAverage.toFixed(2) : '',
                week.csatTrend !== null ? week.csatTrend.toFixed(2) : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});

