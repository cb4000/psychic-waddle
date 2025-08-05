<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Svelte Optimization Component</title>
</head>
<body>
    <div id="app"></div>

    <script>
        // Mock Svelte component structure
        let activeTab = 'create';
        let startDate = '2024-01-01';
        let endDate = '2024-12-31';

        // Mock data for variables
        const optimizationData = {
            optimizationVariables: [
                { name: "Portfolio Allocation", currentValue: "60/40", unit: "" },
                { name: "Risk Tolerance", currentValue: "0.15", unit: "" },
                { name: "Rebalancing Frequency", currentValue: "Quarterly", unit: "" },
                { name: "Cash Reserve", currentValue: "5.2", unit: "%" }
            ],
            otherVariables: [
                { name: "Market Volatility", currentValue: "0.18", unit: "" },
                { name: "Interest Rate", currentValue: "4.25", unit: "%" },
                { name: "Inflation Rate", currentValue: "2.8", unit: "%" },
                { name: "Transaction Costs", currentValue: "0.05", unit: "%" },
                { name: "Tax Rate", currentValue: "22", unit: "%" }
            ]
        };

        // Mock historical runs data
        const historicalRuns = [
            {
                id: 1,
                title: "Q4 2024 Portfolio Optimization",
                status: "running",
                dateRange: "2024-01-01 to 2024-12-31",
                duration: "2m 34s",
                completed: "Today, 2:15 PM",
                result: null,
                progress: "67%"
            },
            {
                id: 2,
                title: "Conservative Risk Profile Test",
                status: "completed",
                dateRange: "2024-07-01 to 2024-12-31",
                duration: "4m 12s",
                completed: "Yesterday, 4:32 PM",
                result: "+12.4%",
                progress: null
            },
            {
                id: 3,
                title: "High Growth Strategy Analysis",
                status: "completed",
                dateRange: "2024-01-01 to 2024-06-30",
                duration: "6m 18s",
                completed: "Dec 18, 2024, 9:45 AM",
                result: "+18.7%",
                progress: null
            },
            {
                id: 4,
                title: "Market Volatility Stress Test",
                status: "failed",
                dateRange: "2024-03-01 to 2024-09-30",
                duration: "1m 23s",
                completed: "Dec 15, 2024, 3:22 PM",
                result: null,
                error: "Data timeout"
            },
            {
                id: 5,
                title: "Balanced Portfolio Baseline",
                status: "completed",
                dateRange: "2023-01-01 to 2023-12-31",
                duration: "3m 45s",
                completed: "Dec 10, 2024, 11:15 AM",
                result: "+8.9%",
                progress: null
            }
        ];

        // Reactive statements (Svelte $: syntax equivalent)
        const stats = {
            total: historicalRuns.length,
            completed: historicalRuns.filter(run => run.status === 'completed').length,
            running: historicalRuns.filter(run => run.status === 'running').length,
            failed: historicalRuns.filter(run => run.status === 'failed').length
        };

        function handleOptimize() {
            console.log(`Running optimization from ${startDate} to ${endDate}`);
        }

        function getStatusClass(status) {
            switch (status) {
                case 'completed': return 'status-completed';
                case 'running': return 'status-running';
                case 'failed': return 'status-failed';
                default: return '';
            }
        }

        // Render the component
        function render() {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="optimization-panel">
                    <div class="panel-header">
                        <h1 class="panel-title">Portfolio Optimization</h1>
                    </div>
                    
                    <div class="tab-navigation">
                        <button class="tab-button ${activeTab === 'create' ? 'active' : ''}" data-tab="create">
                            Create New Run
                        </button>
                        <button class="tab-button ${activeTab === 'history' ? 'active' : ''}" data-tab="history">
                            View History
                        </button>
                    </div>
                    
                    ${activeTab === 'create' ? `
                        <div class="tab-content">
                            <div class="variables-container">
                                <div class="variable-section optimization-variables">
                                    <h3>Optimization Variables <span class="variable-count">(4 parameters)</span></h3>
                                    ${optimizationData.optimizationVariables.map(variable => `
                                        <div class="variable-item">
                                            <span class="variable-name">${variable.name}</span>
                                            <span class="variable-value">${variable.currentValue}${variable.unit}</span>
                                        </div>
                                    `).join('')}
                                </div>

                                <div class="variable-section other-variables">
                                    <h3>Market Variables <span class="variable-count">(5 constraints)</span></h3>
                                    ${optimizationData.otherVariables.map(variable => `
                                        <div class="variable-item">
                                            <span class="variable-name">${variable.name}</span>
                                            <span class="variable-value">${variable.currentValue}${variable.unit}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="controls-section">
                                <h3 class="controls-title">Optimization Parameters</h3>
                                <div class="date-inputs">
                                    <div class="date-group">
                                        <label for="start-date">Start Date</label>
                                        <input type="date" id="start-date" value="${startDate}">
                                    </div>
                                    <div class="date-group">
                                        <label for="end-date">End Date</label>
                                        <input type="date" id="end-date" value="${endDate}">
                                    </div>
                                </div>
                                <button class="optimize-button" id="optimize-btn">Run Optimization</button>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${activeTab === 'history' ? `
                        <div class="tab-content">
                            <div class="history-header">
                                <h2 class="history-title">Optimization History</h2>
                                <div class="history-stats">
                                    <div class="stat-item">
                                        <span class="stat-value">${stats.total}</span>
                                        <span>Total Runs</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">${stats.completed}</span>
                                        <span>Completed</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">${stats.running}</span>
                                        <span>Running</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value">${stats.failed}</span>
                                        <span>Failed</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="runs-list">
                                ${historicalRuns.map(run => `
                                    <div class="run-item">
                                        <div class="run-header">
                                            <h3 class="run-title">${run.title}</h3>
                                            <span class="run-status ${getStatusClass(run.status)}">${run.status}</span>
                                        </div>
                                        <div class="run-details">
                                            <div class="detail-item">
                                                <span class="detail-label">Date Range:</span>
                                                <span class="detail-value">${run.dateRange}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">Duration:</span>
                                                <span class="detail-value">${run.duration}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">${run.status === 'failed' ? 'Failed:' : 'Completed:'}</span>
                                                <span class="detail-value">${run.completed}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="detail-label">
                                                    ${run.status === 'running' ? 'Progress:' : 
                                                      run.status === 'failed' ? 'Error:' : 'Return:'}
                                                </span>
                                                <span class="detail-value">${run.progress || run.error || run.result}</span>
                                            </div>
                                        </div>
                                        <div class="run-actions">
                                            ${run.status === 'completed' ? `
                                                <button class="action-button action-view">View Results</button>
                                                <button class="action-button action-download">Download</button>
                                            ` : ''}
                                            ${run.status === 'failed' ? `
                                                <button class="action-button action-view">View Logs</button>
                                            ` : ''}
                                            <button class="action-button action-delete">Delete</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Add event listeners after rendering
            setupEventListeners();
        }

        function setupEventListeners() {
            // Tab switching
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    activeTab = button.dataset.tab;
                    render(); // Re-render on state change
                });
            });

            // Date inputs (Svelte bind:value equivalent)
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (startDateInput) {
                startDateInput.addEventListener('change', (e) => {
                    startDate = e.target.value;
                });
            }
            
            if (endDateInput) {
                endDateInput.addEventListener('change', (e) => {
                    endDate = e.target.value;
                });
            }

            // Optimize button
            const optimizeBtn = document.getElementById('optimize-btn');
            if (optimizeBtn) {
                optimizeBtn.addEventListener('click', handleOptimize);
            }
        }

        // Initial render
        render();
    </script>

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
            line-height: 1.6;
        }
        
        .optimization-panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .panel-header {
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            padding: 24px 32px;
            text-align: center;
        }
        
        .panel-title {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
        }
        
        .tab-navigation {
            display: flex;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .tab-button {
            flex: 1;
            padding: 16px 24px;
            background: none;
            border: none;
            font-size: 16px;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 3px solid transparent;
        }
        
        .tab-button.active {
            color: #3b82f6;
            background: white;
            border-bottom-color: #3b82f6;
        }
        
        .tab-button:hover {
            background: #f3f4f6;
        }
        
        .tab-content {
            padding: 32px;
        }
        
        .variables-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }
        
        @media (max-width: 768px) {
            .variables-container {
                grid-template-columns: 1fr;
            }
        }
        
        .variable-section {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        
        .variable-section h3 {
            margin: 0 0 16px 0;
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        
        .optimization-variables h3 {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }
        
        .other-variables h3 {
            color: #6b7280;
            border-bottom-color: #6b7280;
        }
        
        .variable-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .variable-item:last-child {
            border-bottom: none;
        }
        
        .variable-name {
            font-weight: 500;
            color: #374151;
            flex: 1;
        }
        
        .variable-value {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            color: #1f2937;
            background: #ffffff;
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            font-weight: 600;
            min-width: 80px;
            text-align: center;
        }
        
        .optimization-variables .variable-value {
            background: #eff6ff;
            border-color: #93c5fd;
            color: #1d4ed8;
        }
        
        .controls-section {
            background: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            border: 1px solid #e5e7eb;
            margin-bottom: 24px;
        }
        
        .controls-title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        
        .date-inputs {
            display: flex;
            gap: 20px;
            align-items: end;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        
        .date-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 160px;
        }
        
        .date-group label {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
        }
        
        .date-group input {
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            background: white;
        }
        
        .date-group input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .optimize-button {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: block;
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }
        
        .optimize-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .variable-count {
            font-size: 12px;
            color: #6b7280;
            font-weight: normal;
            margin-left: 8px;
        }
        
        .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .history-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }
        
        .history-stats {
            display: flex;
            gap: 24px;
            font-size: 14px;
            color: #6b7280;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .runs-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .run-item {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.2s;
        }
        
        .run-item:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .run-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .run-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }
        
        .run-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-completed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-running {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-failed {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .run-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 12px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
        }
        
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        
        .detail-value {
            color: #1f2937;
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .run-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
        }
        
        .action-button {
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid;
        }
        
        .action-view {
            background: #eff6ff;
            color: #1d4ed8;
            border-color: #93c5fd;
        }
        
        .action-download {
            background: #f0fdf4;
            color: #166534;
            border-color: #bbf7d0;
        }
        
        .action-delete {
            background: #fef2f2;
            color: #dc2626;
            border-color: #fecaca;
        }
        
        .action-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
    </style>
</body>
</html>
