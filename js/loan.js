document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loan-form');
  const statusDiv = document.getElementById('loan-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('loan-amount').value);
    const pan = document.getElementById('pan-number').value.toUpperCase();
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    let income = 0, savings = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'savings' && tx.transactionType === 'deposit') savings += tx.amount;
    });

    const creditScore = income > 15000 && savings > 5000 ? 750 : 600;

    if (pan.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      statusDiv.innerHTML = `<div class="alert alert-danger">Invalid PAN format</div>`;
      return;
    }

    if (creditScore >= 700 && amount < income * 0.4) {
      const loanData = {
        amount: amount,
        pan: pan,
        creditScore: creditScore,
        status: 'Approved',
        date: new Date().toLocaleDateString()
      };
      localStorage.setItem('loanApplication', JSON.stringify(loanData));
      statusDiv.innerHTML = `<div class="alert alert-success">
        ✅ Loan Approved!<br>Credit Score: ${creditScore}<br>Amount: ₹${amount}
      </div>`;
    } else {
      statusDiv.innerHTML = `<div class="alert alert-warning">
        ❌ Loan Rejected.<br>Credit Score: ${creditScore}<br>Try improving your savings or applying for a lower amount.
      </div>`;
    }
  });
});
