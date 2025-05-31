document.addEventListener('DOMContentLoaded', () => {
  const loan = JSON.parse(localStorage.getItem('loanApplication'));
  const summaryDiv = document.getElementById('repayment-summary');
  const emiBody = document.getElementById('emi-table-body');

  if (!loan || loan.status !== 'Approved') {
    summaryDiv.innerHTML = `<div class="alert alert-danger">❌ No approved loan found. Please apply first.</div>`;
    return;
  }

  const emiMonths = 3;
  const emiAmount = (loan.amount / emiMonths).toFixed(2);
  const startDate = new Date();
  const emiSchedule = [];

  for (let i = 0; i < emiMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    emiSchedule.push({
      id: i + 1,
      dueDate: dueDate.toLocaleDateString(),
      amount: emiAmount,
      status: "Pending"
    });
  }

  summaryDiv.innerHTML = `
    <div class="alert alert-info">
      <strong>Loan Amount:</strong> ₹${loan.amount} <br>
      <strong>Credit Score:</strong> ${loan.creditScore} <br>
      <strong>Installments:</strong> 3 months × ₹${emiAmount}
    </div>
  `;

  emiSchedule.forEach(emi => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emi.id}</td>
      <td>${emi.dueDate}</td>
      <td>₹${emi.amount}</td>
      <td><span class="badge bg-warning text-dark">${emi.status}</span></td>
    `;
    emiBody.appendChild(row);
  });
});
