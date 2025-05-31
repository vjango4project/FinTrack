document.addEventListener('DOMContentLoaded', function() {
            // Initialize variables
            let goals = JSON.parse(localStorage.getItem('goals')) || [];
            let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            let currentGoalId = null;
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('contribution-date').value = today;
            document.getElementById('goal-deadline').value = today;
            
            // Load data
            loadGoals();
            
            // Save Goal button click handler
            document.getElementById('save-goal-btn').addEventListener('click', function() {
                const name = document.getElementById('goal-name').value;
                const amount = parseFloat(document.getElementById('goal-amount').value);
                const description = document.getElementById('goal-description').value;
                const deadline = document.getElementById('goal-deadline').value;
                
                if (!name || isNaN(amount) || !deadline) {
                    alert('Please fill all required fields');
                    return;
                }
                
                const newGoal = {
                    id: Date.now(),
                    name: name,
                    targetAmount: amount,
                    currentAmount: 0,
                    description: description,
                    deadline: deadline,
                    contributions: []
                };
                
                goals.push(newGoal);
                localStorage.setItem('goals', JSON.stringify(goals));
                
                // Reset form
                document.getElementById('goal-form').reset();
                document.getElementById('goal-deadline').value = today;
                
                // Close modal and refresh
                bootstrap.Modal.getInstance(document.getElementById('addGoalModal')).hide();
                loadGoals();
            });
            
            // Contribution form submission
            document.getElementById('contribution-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const amount = parseFloat(document.getElementById('contribution-amount').value);
                const date = document.getElementById('contribution-date').value;
                const notes = document.getElementById('contribution-notes').value;
                
                // Calculate remaining budget
                const summary = calculateBudgetSummary();
                const remainingBudget = summary.remainingBudget;
                
                // Validate contribution doesn't exceed remaining budget
                if (amount > remainingBudget) {
                    alert(`You can't contribute more than your remaining budget of ₹${remainingBudget.toFixed(2)}`);
                    return;
                }
                
                // Find the current goal
                const goalIndex = goals.findIndex(g => g.id === currentGoalId);
                if (goalIndex === -1) return;
                
                // Add contribution to goal
                const contribution = {
                    amount: amount,
                    date: date,
                    notes: notes
                };
                
                goals[goalIndex].contributions.push(contribution);
                goals[goalIndex].currentAmount += amount;
                localStorage.setItem('goals', JSON.stringify(goals));
                
                // Add as savings transaction
                const newTransaction = {
                    id: Date.now(),
                    amount: amount,
                    type: 'savings',
                    transactionType: 'deposit',
                    goal: goals[goalIndex].name,
                    description: notes || `Contribution to ${goals[goalIndex].name} goal`,
                    date: date
                };
                
                transactions.push(newTransaction);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                
                // Reset form
                this.reset();
                document.getElementById('contribution-date').value = today;
                
                // Update goal detail view
                loadGoalDetail(currentGoalId);
                loadGoals();
            });
            
            // Load all goals
            function loadGoals() {
                const goalsContainer = document.getElementById('goals-container');
                goalsContainer.innerHTML = '';
                
                if (goals.length === 0) {
                    goalsContainer.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <i class="fas fa-bullseye fa-3x text-muted mb-3"></i>
                            <h4 class="text-muted">No goals yet</h4>
                            <p>Click the "Add Goal" button to create your first financial goal</p>
                        </div>
                    `;
                    return;
                }
                
                goals.forEach(goal => {
                    const progressPercent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
                    const daysLeft = calculateDaysLeft(goal.deadline);
                    
                    const goalCard = document.createElement('div');
                    goalCard.className = 'col-md-4 mb-4';
                    goalCard.innerHTML = `
                        <div class="card goal-card h-100" data-goal-id="${goal.id}">
                            <div class="card-body">
                                <h5 class="card-title">${goal.name}</h5>
                                <p class="card-text text-muted">${goal.description || 'No description'}</p>
                                
                                <div class="d-flex justify-content-between mb-2">
                                    <span>₹${goal.currentAmount.toFixed(2)} saved</span>
                                    <span>₹${goal.targetAmount.toFixed(2)} target</span>
                                </div>
                                <div class="progress mb-3">
                                    <div class="progress-bar" role="progressbar" style="width: ${progressPercent}%" 
                                        aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
                                        ${progressPercent}%
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between text-sm">
                                    <span>Deadline: ${new Date(goal.deadline).toLocaleDateString()}</span>
                                    <span>${daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    goalsContainer.appendChild(goalCard);
                });
                
                // Add click event to all goal cards
                document.querySelectorAll('.goal-card').forEach(card => {
                    card.addEventListener('click', function() {
                        const goalId = parseInt(this.getAttribute('data-goal-id'));
                        currentGoalId = goalId;
                        loadGoalDetail(goalId);
                        const modal = new bootstrap.Modal(document.getElementById('goalDetailModal'));
                        modal.show();
                    });
                });
            }
            
            // Load goal detail view
            function loadGoalDetail(goalId) {
                const goal = goals.find(g => g.id === goalId);
                if (!goal) return;
                
                const progressPercent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
                const daysLeft = calculateDaysLeft(goal.deadline);
                
                // Update modal header
                document.getElementById('detail-goal-name').textContent = goal.name;
                document.getElementById('detail-goal-description').textContent = goal.description || 'No description';
                
                // Update progress info
                document.getElementById('detail-saved-amount').textContent = goal.currentAmount.toFixed(2);
                document.getElementById('detail-target-amount').textContent = goal.targetAmount.toFixed(2);
                
                const progressBar = document.getElementById('detail-progress-bar');
                progressBar.style.width = `${progressPercent}%`;
                progressBar.setAttribute('aria-valuenow', progressPercent);
                progressBar.textContent = `${progressPercent}%`;
                
                // Update deadline info
                document.getElementById('detail-deadline').textContent = new Date(goal.deadline).toLocaleDateString();
                document.getElementById('detail-days-left').textContent = daysLeft > 0 
                    ? `${daysLeft} days left` 
                    : 'Deadline passed';
                
                // Update contribution limit
                const summary = calculateBudgetSummary();
                document.getElementById('contribution-limit').textContent = 
                    `You can contribute up to ₹${summary.remainingBudget.toFixed(2)}`;
                
                // Load contributions
                const contributionsTable = document.getElementById('contributions-table');
                contributionsTable.innerHTML = '';
                
                if (goal.contributions.length === 0) {
                    contributionsTable.innerHTML = `
                        <tr>
                            <td colspan="3" class="text-center text-muted">No contributions yet</td>
                        </tr>
                    `;
                    return;
                }
                
                // Sort contributions by date (newest first)
                const sortedContributions = [...goal.contributions].sort((a, b) => new Date(b.date) - new Date(a.date));
                
                sortedContributions.forEach(contribution => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${new Date(contribution.date).toLocaleDateString()}</td>
                        <td>₹${contribution.amount.toFixed(2)}</td>
                        <td>${contribution.notes || '-'}</td>
                    `;
                    contributionsTable.appendChild(row);
                });
            }
            
            // Helper function to calculate days left
            function calculateDaysLeft(deadline) {
                const today = new Date();
                const deadlineDate = new Date(deadline);
                const diffTime = deadlineDate - today;
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            
            // Helper function to calculate budget summary
            function calculateBudgetSummary() {
                let totalIncome = 0;
                let totalExpense = 0;
                let totalSavingsDeposits = 0;
                let totalSavingsWithdrawals = 0;
                
                transactions.forEach(transaction => {
                    if (transaction.type === 'income') {
                        totalIncome += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        totalExpense += transaction.amount;
                    } else if (transaction.type === 'savings') {
                        if (transaction.transactionType === 'deposit') {
                            totalSavingsDeposits += transaction.amount;
                        } else {
                            totalSavingsWithdrawals += transaction.amount;
                        }
                    }
                });
                
                const remainingBudget = totalIncome - totalExpense - totalSavingsDeposits;
                
                return {
                    income: totalIncome,
                    expenses: totalExpense,
                    savingsDeposits: totalSavingsDeposits,
                    savingsWithdrawals: totalSavingsWithdrawals,
                    remainingBudget: remainingBudget
                };
            }
        });