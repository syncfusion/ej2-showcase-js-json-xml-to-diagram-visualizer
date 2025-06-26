// Initialize panel resizer functionality for split layout
export function initResizer() {
    const splitterElement = document.querySelector('.splitter');
    const leftPanelElement = document.querySelector('.left-panel');
    let isCurrentlyDragging = false;

    // Handle mouse down event to start dragging operation
    splitterElement.addEventListener('mousedown', (mouseDownEvent) => {
        isCurrentlyDragging = true;
        document.body.style.cursor = 'col-resize';
    });

    // Handle mouse move event to resize panels during drag
    document.addEventListener('mousemove', (mouseMoveEvent) => {
        if (!isCurrentlyDragging) return;

        const mainGridTotalWidth = document.querySelector('.main-grid').offsetWidth;
        const rightPanelMinimumWidth = mainGridTotalWidth * 0.5; // 50% minimum for right
        const calculatedLeftWidth = Math.min(mouseMoveEvent.clientX, mainGridTotalWidth - rightPanelMinimumWidth);
        leftPanelElement.style.width = `${calculatedLeftWidth}px`;
    });

    // Handle mouse up event to stop dragging operation
    document.addEventListener('mouseup', () => {
        if (isCurrentlyDragging) {
            isCurrentlyDragging = false;
            document.body.style.cursor = '';
        }
    });
};