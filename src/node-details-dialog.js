import themeService from './themeService.js';
// Enable ripple effect for UI components
ej.base.enableRipple(true);

let nodeDetailsDialog = null;
let currentNodeRawContent = '';

// Parse content lines into formatted JSON key-value pairs
export function formatJsonLines(inputContent) {
  if (!inputContent || !inputContent.trim()) return [];
  const contentLines = inputContent.split('\n');
  const formattedJsonLines = [];

  contentLines.forEach((currentLine, lineIndex) => {
    const colonIndex = currentLine.indexOf(':');
    if (colonIndex < 0) return;
    const extractedKey = currentLine.slice(0, colonIndex).trim();
    let extractedValue = currentLine.slice(colonIndex + 1).trim();
    let processedValue;

    if (/^(true|false)$/i.test(extractedValue)) processedValue = extractedValue.toLowerCase();
    else if (!isNaN(parseFloat(extractedValue))) processedValue = extractedValue;
    else processedValue = `"${extractedValue.replace(/^"(.*)"$/, '$1')}"`;

    const isLastLine = lineIndex === contentLines.length - 1;
    formattedJsonLines.push({
      key: `"${extractedKey}"`,
      value: processedValue,
      hasComma: !isLastLine
    });
  });

  return formattedJsonLines;
}

// Add curly braces around root path for better display
function addCurlyBracesAroundRoot(pathInput) {
  if (pathInput.startsWith('Root')) {
    return `{Root}${pathInput.slice(4)}`;
  }
  return pathInput;
}

// Build HTML content for displaying formatted JSON data
function buildContentHtml(rawContentData) {
  const currentThemeSettings = themeService.getCurrentThemeSettings();
  const parsedJsonLines = formatJsonLines(rawContentData);
  let generatedHtml = `<div style="padding:10px; overflow-x:auto; font-family:Consolas; font-size:14px;">`;

  if (parsedJsonLines.length === 0) {
    generatedHtml += `<div style="color:${currentThemeSettings.popupValueColor};">"${rawContentData.trim()}"</div>`;
  } else {
    generatedHtml += `<div>{</div>`;
    parsedJsonLines.forEach(({ key, value, hasComma }) => {
      generatedHtml += `
        <div style="line-height:16px;">
          <span style="color:${currentThemeSettings.popupKeyColor}; font-weight:550; margin-left:14px;">${key}</span>
          <span style="margin-right:3px;">:</span>
          <span style="color:${currentThemeSettings.popupValueColor};">${value}</span>${hasComma ? ',' : ''}
        </div>`;
    });
    generatedHtml += `<div>}</div>`;
  }

  generatedHtml += `</div>`;
  return generatedHtml;
}

// Build HTML content for displaying JSON path
function buildPathHtml(rawJsonPath) {
  const currentThemeSettings = themeService.getCurrentThemeSettings();
  const formattedPath = addCurlyBracesAroundRoot(rawJsonPath.trim());
  return `<div style="padding:10px; overflow-x:auto; font-family:Consolas; font-size:14px;">${formattedPath}</div>`;
}

// Generate formatted JSON string from raw content
function getFormattedJsonString(rawContentInput) {
  const parsedContentLines = formatJsonLines(rawContentInput);
  if (parsedContentLines.length === 0) return `"${rawContentInput.trim()}"`;
  let formattedJsonResult = '{\n';
  parsedContentLines.forEach(({ key, value, hasComma }) => {
    formattedJsonResult += `    ${key}: ${value}${hasComma ? ',' : ''}\n`;
  });
  formattedJsonResult += '}';
  return formattedJsonResult;
}

// Initialize the node details dialog component
export function initNodeDetailsDialog() {
  const dialogContainer = document.createElement('div');
  dialogContainer.id = 'node-details-dialog';
  document.body.appendChild(dialogContainer);

  // Create dialog with content and path display sections
  nodeDetailsDialog = new ej.popups.Dialog({
    width: '400px',
    header: 'Node Details',
    showCloseIcon: true,
    isModal: true,
    animationSettings: { effect: 'Zoom' },
    closeOnEscape: true,
    content: `
      <div style="font-family:Segoe UI, sans-serif; font-size:14px;">
        <div style="margin-bottom:15px;">
          <label style="font-weight:500; display:block; margin-bottom:5px;">Content</label>
          <div class="dialog-box" style="border-radius:5px; position:relative;">
            <div id="ndd-content"></div>
            <button id="ndd-copy-content" style="position:absolute; top:5px; right:5px; background:transparent; border:none; cursor:pointer;">
              <span class="e-icons e-copy" style="color:#6C757D"></span>
            </button>
          </div>
        </div>
        <div>
          <label style="font-weight:500; display:block; margin-bottom:5px;">JSON Path</label>
          <div class="dialog-box" style="border-radius:5px; position:relative;">
            <div id="ndd-path"></div>
            <button id="ndd-copy-path" style="position:absolute; top:5px; right:5px; background:transparent; border:none; cursor:pointer;">
              <span class="e-icons e-copy" style="color:#6C757D"></span>
            </button>
          </div>
        </div>
      </div>`,
    overlayClick: () => nodeDetailsDialog.hide()
  });

  nodeDetailsDialog.appendTo('#node-details-dialog');

  // Handle copy button click events for content and path
  document.body.addEventListener('click', clickEvent => {
    if (clickEvent.target.closest('#ndd-copy-content')) {
      const formattedJsonContent = getFormattedJsonString(currentNodeRawContent);
      navigator.clipboard.writeText(formattedJsonContent);
      const copyIconElement = clickEvent.target.closest('button').querySelector('.e-icons');
      copyIconElement.classList.replace('e-copy', 'e-check');
      setTimeout(() => copyIconElement.classList.replace('e-check', 'e-copy'), 1500);
    }

    if (clickEvent.target.closest('#ndd-copy-path')) {
      const pathTextContent = document.getElementById('ndd-path').textContent;
      navigator.clipboard.writeText(pathTextContent);
      const pathCopyIconElement = clickEvent.target.closest('button').querySelector('.e-icons');
      pathCopyIconElement.classList.replace('e-copy', 'e-check');
      setTimeout(() => pathCopyIconElement.classList.replace('e-check', 'e-copy'), 1500);
    }
  });
}

// Bind event listeners for node details dialog functionality
export function bindNodeDetailsDialogEvents() {
  // Listen for node data click events to show dialog
  window.addEventListener('nodeDataClick', nodeClickEvent => {
    currentNodeRawContent = nodeClickEvent.detail.content;
    if (!nodeDetailsDialog) initNodeDetailsDialog();
    document.getElementById('ndd-content').innerHTML = buildContentHtml(nodeClickEvent.detail.content);
    document.getElementById('ndd-path').innerHTML = buildPathHtml(nodeClickEvent.detail.path);
    nodeDetailsDialog.show();
  });
}