// Initialize Spinner
export function initializeSpinner() {
    ej.base.enableRipple(true);
    ej.popups.createSpinner({
        target: document.getElementById('spinner-container'),
    });
}

// Show Spinner
export function showSpinner() {
    ej.popups.showSpinner(document.getElementById('spinner-container'));
}

// Hide Spinner
export function hideSpinner() {
    ej.popups.hideSpinner(document.getElementById('spinner-container'));
}