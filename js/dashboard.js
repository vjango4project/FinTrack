document.addEventListener('DOMContentLoaded', function() {
            // Initialize variables
            let expenseChart, budgetChart;
            let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            
            // Sample data for initial load
            if (transactions.length === 0) {
                // Add some sample transactions if none exist
                transactions = [
                    {
                        id: 1,
                        amount: 50000,
                        type: 'income',
                        source: 'Salary',
                        description: 'Monthly salary',
                        date: new Date().toISOString().split('T')[0]
                    },
                    {
                        id: 2,
                        amount: 1500,
                        type: 'expense',
                        category: 'Food & Dining',
                        description: 'Dinner with friends',
                        date: new Date().toISOString().split('T')[0]
                    },
                    {
                        id: 3,
                        amount: 10000,
                        type: 'savings',
                        transactionType: 'deposit',
                        goal: 'Emergency Fund',
                        description: 'Monthly savings',
                        date: new Date().toISOString().split('T')[0]
                    }
                ];
                localStorage.setItem('transactions', JSON.stringify(transactions));
            }
            
            // Load data
            function loadData() {
                const summary = calculateSummary();
                updateCharts();
                updateTransactionsTable();
                
                // Update form limits
                document.getElementById('expense-limit').textContent = `You can spend up to ₹${summary.remainingBudget.toFixed(2)}`;
                document.getElementById('savings-limit').textContent = 
                    document.getElementById('savings-type').value === 'deposit' 
                    ? `You can save up to ₹${summary.remainingBudget.toFixed(2)}` 
                    : `You can withdraw up to ₹${summary.savings.toFixed(2)}`;
            }
            
            // Calculate financial summary
            function calculateSummary() {
                let totalIncome = 0;
                let totalExpense = 0;
                let totalSavingsDeposits = 0;
                let totalSavingsWithdrawals = 0;
                const expenseByCategory = {};
                
                transactions.forEach(transaction => {
                    if (transaction.type === 'income') {
                        totalIncome += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        totalExpense += transaction.amount;
                        
                        // Categorize expenses
                        if (expenseByCategory[transaction.category]) {
                            expenseByCategory[transaction.category] += transaction.amount;
                        } else {
                            expenseByCategory[transaction.category] = transaction.amount;
                        }
                    } else if (transaction.type === 'savings') {
                        if (transaction.transactionType === 'deposit') {
                            totalSavingsDeposits += transaction.amount;
                        } else {
                            totalSavingsWithdrawals += transaction.amount;
                        }
                    }
                });
                
                const totalSavings = totalSavingsDeposits - totalSavingsWithdrawals;
                const remainingBudget = totalIncome - totalExpense - totalSavingsDeposits;
                
                // Update UI
                document.getElementById('total-income').textContent = totalIncome.toFixed(2);
                document.getElementById('total-expense').textContent = totalExpense.toFixed(2);
                document.getElementById('total-savings').textContent = totalSavings.toFixed(2);
                document.getElementById('remaining-budget').textContent = remainingBudget.toFixed(2);
                
                return {
                    income: totalIncome,
                    expenses: totalExpense,
                    savings: totalSavings,
                    savingsDeposits: totalSavingsDeposits,
                    savingsWithdrawals: totalSavingsWithdrawals,
                    remainingBudget: remainingBudget,
                    expenseByCategory: expenseByCategory
                };
            }
            
            // Update charts with data
            function updateCharts() {
                const summaryData = calculateSummary();
                const expenseCtx = document.getElementById('expenseChart').getContext('2d');
                const budgetCtx = document.getElementById('budgetChart').getContext('2d');
                
                // Destroy existing charts if they exist
                if (expenseChart) expenseChart.destroy();
                if (budgetChart) budgetChart.destroy();
                
                // Expense Breakdown Chart
                if (Object.keys(summaryData.expenseByCategory).length > 0) {
                    expenseChart = new Chart(expenseCtx, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(summaryData.expenseByCategory),
                            datasets: [{
                                data: Object.values(summaryData.expenseByCategory),
                                backgroundColor: [
                                    '#4285F4',
                                    '#34A853',
                                    '#FBBC05',
                                    '#EA4335',
                                    '#673AB7',
                                    '#FF9800',
                                    '#9C27B0',
                                    '#00BCD4'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: {
                                        boxWidth: 12,
                                        padding: 10
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: ₹${value} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    document.getElementById('expenseChart').innerHTML = '<p class="text-muted">No expense data available</p>';
                }

                // Budget Chart
                budgetChart = new Chart(budgetCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Income', 'Expenses', 'Savings'],
                        datasets: [{
                            label: 'Amount (₹)',
                            data: [
                                summaryData.income || 0, 
                                summaryData.expenses || 0, 
                                summaryData.savings || 0
                            ],
                            backgroundColor: [
                                '#2ecc71',
                                '#e74c3c',
                                '#3498db'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            },
                            x: {
                                ticks: {
                                    autoSkip: false,
                                    maxRotation: 0,
                                    minRotation: 0,
                                    padding: 10
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
            
            // Update transactions table
            function updateTransactionsTable() {
                const transactionsTable = document.getElementById('transactions-table');
                transactionsTable.innerHTML = '';
                
                // Sort transactions by date (newest first) and then by ID (for transactions on same date)
                const sortedTransactions = [...transactions].sort((a, b) => {
                    const dateDiff = new Date(b.date) - new Date(a.date);
                    return dateDiff !== 0 ? dateDiff : b.id - a.id;
                });
                
                // Display only the 5 most recent transactions
                const recentTransactions = sortedTransactions.slice(0, 5);
                
                recentTransactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    
                    // Set row color based on type
                    if (transaction.type === 'income') {
                        row.classList.add('table-success');
                    } else if (transaction.type === 'expense') {
                        row.classList.add('table-danger');
                    } else if (transaction.type === 'savings') {
                        row.classList.add('table-info');
                    }
                    
                    row.innerHTML = `
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${transaction.description || 'N/A'}</td>
                        <td>${transaction.category || transaction.source || (transaction.goal || 'Savings')}</td>
                        <td>₹${transaction.amount.toFixed(2)}</td>
                        <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}${transaction.transactionType ? ' (' + transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1) + ')' : ''}</td>
                    `;
                    transactionsTable.appendChild(row);
                });
            }
            
            // Form submissions
            document.getElementById('expense-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const amount = parseFloat(document.getElementById('expense-amount').value);
                const category = document.getElementById('expense-category').value;
                const date = document.getElementById('expense-date').value;
                const description = document.getElementById('expense-description').value;
                
                const summary = calculateSummary();
                
                // Validate expense doesn't exceed remaining budget
                if (amount > summary.remainingBudget) {
                    alert(`You can't spend more than your remaining budget of ₹${summary.remainingBudget.toFixed(2)}`);
                    return;
                }
                
                // Create new transaction
                const newTransaction = {
                    id: Date.now(),
                    amount: amount,
                    type: 'expense',
                    category: category,
                    description: description,
                    date: date
                };
                
                // Add to transactions array
                transactions.push(newTransaction);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                
                alert('Expense added successfully!');
                this.reset();
                document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
                loadData(); // Refresh data
            });
            
            document.getElementById('income-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const amount = parseFloat(document.getElementById('income-amount').value);
                const source = document.getElementById('income-source').value;
                const date = document.getElementById('income-date').value;
                const description = document.getElementById('income-description').value;
                
                // Create new transaction
                const newTransaction = {
                    id: Date.now(),
                    amount: amount,
                    type: 'income',
                    source: source,
                    description: description,
                    date: date
                };
                
                // Add to transactions array
                transactions.push(newTransaction);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                
                alert('Income added successfully!');
                this.reset();
                document.getElementById('income-date').value = new Date().toISOString().split('T')[0];
                loadData(); // Refresh data
            });
            
            document.getElementById('savings-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const amount = parseFloat(document.getElementById('savings-amount').value);
                const transactionType = document.getElementById('savings-type').value;
                const goal = document.getElementById('savings-goal').value;
                const date = document.getElementById('savings-date').value;
                const description = document.getElementById('savings-description').value;
                
                const summary = calculateSummary();
                
                // Validate savings transaction
                if (transactionType === 'deposit' && amount > summary.remainingBudget) {
                    alert(`You can't save more than your remaining budget of ₹${summary.remainingBudget.toFixed(2)}`);
                    return;
                }
                
                if (transactionType === 'withdraw' && amount > summary.savings) {
                    alert(`You can't withdraw more than your savings of ₹${summary.savings.toFixed(2)}`);
                    return;
                }
                
                // Create new transaction
                const newTransaction = {
                    id: Date.now(),
                    amount: amount,
                    type: 'savings',
                    transactionType: transactionType,
                    goal: goal,
                    description: description,
                    date: date
                };
                
                // Add to transactions array
                transactions.push(newTransaction);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                
                alert('Savings transaction recorded!');
                this.reset();
                document.getElementById('savings-date').value = new Date().toISOString().split('T')[0];
                loadData(); // Refresh data
            });
            
            // Update savings limit when transaction type changes
            document.getElementById('savings-type').addEventListener('change', function() {
                const summary = calculateSummary();
                document.getElementById('savings-limit').textContent = 
                    this.value === 'deposit' 
                    ? `You can save up to ₹${summary.remainingBudget.toFixed(2)}` 
                    : `You can withdraw up to ₹${summary.savings.toFixed(2)}`;
            });
            
            // View All button click handler
            document.getElementById('view-all-btn').addEventListener('click', function(e) {
                e.preventDefault();
                const transactionsTable = document.getElementById('transactions-table');
                transactionsTable.innerHTML = '';
                
                // Sort transactions by date (newest first)
                const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
                
                sortedTransactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    
                    // Set row color based on type
                    if (transaction.type === 'income') {
                        row.classList.add('table-success');
                    } else if (transaction.type === 'expense') {
                        row.classList.add('table-danger');
                    } else if (transaction.type === 'savings') {
                        row.classList.add('table-info');
                    }
                    
                    row.innerHTML = `
                        <td>${new Date(transaction.date).toLocaleDateString()}</td>
                        <td>${transaction.description || 'N/A'}</td>
                        <td>${transaction.category || transaction.source || (transaction.goal || 'Savings')}</td>
                        <td>₹${transaction.amount.toFixed(2)}</td>
                        <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}${transaction.transactionType ? ' (' + transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1) + ')' : ''}</td>
                    `;
                    transactionsTable.appendChild(row);
                });
            });
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('expense-date').value = today;
            document.getElementById('income-date').value = today;
            document.getElementById('savings-date').value = today;
            
            // Initial data load
            loadData();
        });