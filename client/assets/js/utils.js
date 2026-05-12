// helper functions
function formatCurrency(amount) {
    return '₱' + parseFloat(amount).toFixed(2);
}

function showAlert(message, type='info') {
    alert(message); // placeholder, can be replaced with custom UI
}

// expose globally for simple usage
window.formatCurrency = formatCurrency;
window.showAlert = showAlert;
