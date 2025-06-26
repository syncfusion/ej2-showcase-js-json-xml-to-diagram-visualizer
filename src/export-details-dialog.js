let diagramInstance;

export function initExportDetailsDialog() {
  createDialogContainer();
  const exportOptionsDialog = createExportDialog();
  
  exportOptionsDialog.appendTo("#export-dialog");
  initializeFormComponents();
  setupEventListeners(exportOptionsDialog);
}

// Create main container element for the export dialog
function createDialogContainer() {
  const exportDialogMainContainer = document.createElement("div");
  exportDialogMainContainer.id = "export-dialog";
  document.body.appendChild(exportDialogMainContainer);
  return exportDialogMainContainer;
}

// Initialize and configure the export dialog with options and content
function createExportDialog() {
  const exportOptionsDialog = new ej.popups.Dialog({
    header: "Export Options",
    showCloseIcon: true,
    isModal: true,
    visible: false,
    width: "300px",
    content: `
      <div style="margin-top: -20px;">
          <p>File Name</p>
          <input type="text" id="file-name" placeholder="Enter file name" value="Diagram" />
      </div>
      <div style="margin-top: 20px;">
          <p>Format</p>
          <div>
              <input type="radio" id="export-mode-png" name="exportMode" value="PNG" checked>
              <label for="export-mode-png" style="margin-right: 10px;"></label>
              <input type="radio" id="export-mode-jpg" name="exportMode" value="JPG">
              <label for="export-mode-jpg" style="margin-right: 10px;"></label>
              <input type="radio" id="export-mode-svg" name="exportMode" value="SVG">
              <label for="export-mode-svg" style="margin-right: 10px;"></label>
          </div>
      </div>
    `,
    buttons: [{
      click: handleExportButtonClick,
      buttonModel: { content: "Export", isPrimary: true }
    }],
    overlayClick: () => {
      const exportDialog = document.querySelector("#export-dialog")?.ej2_instances?.[0];
      if (exportDialog) {
        exportDialog.hide();
      }
    }
  });
  
  return exportOptionsDialog;
}

// Handle export button click event and execute diagram export
function handleExportButtonClick() {
  const userFileName = document.getElementById("file-name").value || "diagram";
  const selectedExportFormat = document.querySelector('input[name="exportMode"]:checked').value;
  
  if (diagramInstance) {
    diagramInstance.exportDiagram({ 
      format: selectedExportFormat, 
      fileName: userFileName 
    });
  }
  
  const exportDialog = document.querySelector("#export-dialog")?.ej2_instances?.[0];
  if (exportDialog) {
    exportDialog.hide();
  }
}

// Initialize all form components in the dialog
function initializeFormComponents() {
  // Initialize filename input field with EJ2 TextBox component
  new ej.inputs.TextBox({ 
    placeholder: "Enter file name" 
  }).appendTo("#file-name");

  // Initialize PNG format radio button with default selection
  new ej.buttons.RadioButton({
    label: "PNG",
    name: "exportMode",
    checked: true,
  }).appendTo("#export-mode-png");

  // Initialize JPG format radio button option
  new ej.buttons.RadioButton({ 
    label: "JPG", 
    name: "exportMode" 
  }).appendTo("#export-mode-jpg");

  // Initialize SVG format radio button option
  new ej.buttons.RadioButton({ 
    label: "SVG", 
    name: "exportMode" 
  }).appendTo("#export-mode-svg");
}

// Setup event listeners for dialog interactions
function setupEventListeners(exportOptionsDialog) {
  // Listen for custom event to display dialog and receive diagram reference
  window.addEventListener("showExportDialog", (event) => {
    diagramInstance = event.detail.diagram;
    exportOptionsDialog.show();
  });
}