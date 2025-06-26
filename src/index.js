import "../styles/index.scss";
import JsonDiagramParser from "./JsonDiagramParser.js";
import themeService from "./themeService.js";
import { initializeSpinner, showSpinner, hideSpinner } from "./spinner.js";
import { initNavbar } from "./navmenu.js";
import { bindNodeDetailsDialogEvents } from "./node-details-dialog.js";
import { initHamburgerMenu } from "./hamburger-menu.js";
import { initResizer } from "./resizer.js";
import { initToolBar } from "./toolbar.js";
import { initExportDetailsDialog } from "./export-details-dialog.js";
import * as monaco from "monaco-editor";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

// Inject required modules into the diagram
ej.diagrams.Diagram.Inject(
  ej.diagrams.DataBinding,
  ej.diagrams.HierarchicalTree,
  ej.diagrams.PrintAndExport
);

// Set the initial theme for the application to "light" mode
themeService.setTheme("light");

// Declare variables for the diagram, editor, and settings
let diagram;
let editor;

// Set initial editor input type to JSON
let currentEditorInputType = "JSON";

// Flags to determine visibility of expand/collapse icons and item count
let showExpandCollapseIcon = true;
let showChildItemsCount = true;

// Variables to manage diagram orientation state
let currentOrientationIndex = 0;
let currentOrientation = "LeftToRight";
const orientations = [
  "LeftToRight",
  "TopToBottom",
  "RightToLeft",
  "BottomToTop",
];

// Retrieve current theme settings from the theme service
let currentThemeSettings = themeService.getCurrentThemeSettings();

// Flag to track whether the graph is collapsed
var isGraphCollapsed = false;

// Configure XMLParser with settings for XML to JSON conversion
const xmlParser = new XMLParser({
  ignoreAttributes: false, // Include attributes in the JSON
  attributeNamePrefix: "", // Remove attribute prefix for cleaner JSON
  allowBooleanAttributes: true, // Parse attributes as booleans if applicable
  parseTagValue: true, // Include text content of tags in the JSON
  parseAttributeValue: true, // Parse content of attributes during conversion
  isArray: () => false, // Convert elements without wrapping in arrays
});

// Initialize various components of the application
initNavbar(); // Setup and initialize the navigation bar
initResizer(); // Initialize resizer for responsive layout
initToolBar(); // Setup and initialize the toolbar
initializeSpinner(); // Setup and initialize the loading spinner
initializeDiagram(); // Initialize the diagram element for visual representation
initExportDetailsDialog(); // Setup the popup dialog for export details
bindNodeDetailsDialogEvents(); // Bind events for node details dialog popup
initHamburgerMenu(() => isGraphCollapsed); // Initialize hamburger menu btn

// Calculates the width of a given text string
const getTextWidth = (text, font) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
};

// Creates a Monaco editor instance with specified configurations and sets up content change handling for JSON and XML parsing
function createEditor(value) {
  // Initializes a Monaco editor instance
  editor = monaco.editor.create(document.getElementById("json-editor"), {
    value,
    language: "json",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    placeholder: "Start Typing...",
    scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
    stickyScroll: { enabled: false }, // prevents getLineMaxColumn errors
  });

  updateEditorStatus(true);

  // Handle the editor content change
  editor.onDidChangeModelContent(handleEditorContentChange);
}

// Processes editor content changes, parses JSON/XML data, and updates diagram visualization
function handleEditorContentChange() {
  const editorContent = editor.getValue();
  if (editorContent.trim() === "") {
    return;
  }
  showSpinner();
  try {
    let diagramData;
    // Parse Json data to Diagram Data
    if (currentEditorInputType.toLowerCase() === "json") {
      const parsed = JSON.parse(editorContent);
      diagramData = JsonDiagramParser.processData(parsed);
    }
    // Convert XML data to Json Data and then Parse it to Diagram Data
    else if (currentEditorInputType.toLowerCase() === "xml") {
      // Check if content starts with '<' to validate basic XML format
      if (!editorContent.trim().startsWith('<')) {
        throw new Error('Invalid XML format');
      }
      // Wrap with a root element for well-formedness and parsing
      const wrapped = `<root>${editorContent}</root>`;
      const jsonObj = xmlParser.parse(wrapped);
      // Use only the content under root
      const extracted = jsonObj.root || {};
      diagramData = JsonDiagramParser.processData(extracted);
    }
    // Load the diagram layout with the parsed data
    if (diagramData) {
      loadDiagramLayout(diagramData.nodes, diagramData.connectors);
      updateEditorStatus(true);
      hideSpinner();
    }
  } catch (e) {
    console.error("Invalid Content:", e);
    updateEditorStatus(false);
    showSpinner();
  }
}

// Initializes and configures the diagram including nodes, connectors, and layout settings
function initializeDiagram() {
  diagram = new ej.diagrams.Diagram({
    width: "100%",
    height: "100%",
    backgroundColor: currentThemeSettings.backgroundColor,
    snapSettings: {
      verticalGridlines: { lineColor: "#EBE8E8" },
      horizontalGridlines: { lineColor: "#EBE8E8" },
    },
    tool:
      ej.diagrams.DiagramTools.ZoomPan | ej.diagrams.DiagramTools.SingleSelect,
    layout: {
      type: "HierarchicalTree",
      orientation: "LeftToRight",
      horizontalSpacing: 30,
      verticalSpacing: 100,
      enableAnimation: false,
      connectionPointOrigin: ej.diagrams.ConnectionPointOrigin.DifferentPoint,
    },
    scrollSettings: { scrollLimit: "Infinity" },
    getNodeDefaults: getNodeDefaults,
    getConnectorDefaults: getConnectorDefaults,
  });
  diagram.appendTo("#diagram");
}

// Defines default styling and behavior for diagram nodes
function getNodeDefaults(node) {
  const isLeafNode = node.additionalInfo && node.additionalInfo.isLeaf === true;
  const isMainRootNode = node?.id === "main-root";
  const fontSpecification = "12px Consolas";
  const textLineHeight = 16;
  const annotationMargin = 10;
  const expandCollapseIconWidth = 36;
  const nodeCornerRadius = 3;
  let totalLinesCount = 0;

  // Set node constraints
  node.constraints =
    ej.diagrams.NodeConstraints.Default &
    ~(
      ej.diagrams.NodeConstraints.Rotate |
      ej.diagrams.NodeConstraints.Select |
      ej.diagrams.NodeConstraints.Resize |
      ej.diagrams.NodeConstraints.Delete |
      ej.diagrams.NodeConstraints.Drag
    );

  // Apply basic styling
  node.shape = {
    type: "Basic",
    shape: isMainRootNode ? "Ellipse" : "Rectangle",
    cornerRadius: nodeCornerRadius,
  };
  node.style = {
    fill: currentThemeSettings.nodeFillColor,
    strokeColor: currentThemeSettings.nodeStrokeColor,
    strokeWidth: 1.5,
  };

  // Set node dimensions
  if (!isMainRootNode) {
    let {
      width: calculatedWidth,
      height: calculatedHeight,
      linesCount: calculatedLinesCount,
    } = calculateNodeSize(
      node,
      fontSpecification,
      annotationMargin,
      textLineHeight,
      expandCollapseIconWidth
    );
    node.width = calculatedWidth;
    node.height = calculatedHeight;
    totalLinesCount = calculatedLinesCount;
  } else {
    node.width = 40;
    node.height = 40;
    totalLinesCount = 0;
  }

  // Configure annotations
  configureNodeAnnotations(
    node,
    isLeafNode,
    fontSpecification,
    annotationMargin,
    expandCollapseIconWidth
  );

  // Configure expand/collapse icons
  configureExpandCollapseIcons(
    node,
    isLeafNode,
    isMainRootNode,
    expandCollapseIconWidth,
    nodeCornerRadius
  );

  return node;
}

// Configures annotations for nodes based on their type
function configureNodeAnnotations(
  node,
  isLeafNode,
  fontSpecification,
  annotationMargin,
  expandCollapseIconWidth
) {
  if (!node.annotations) return;

  if (isLeafNode) {
    configureLeafNodeAnnotations(node, fontSpecification, annotationMargin);
  } else if (node.annotations.length === 2 && !isLeafNode) {
    configureParentNodeAnnotations(
      node,
      annotationMargin,
      expandCollapseIconWidth
    );
  }
}

// Configures annotations for leaf nodes (key-value pairs)
function configureLeafNodeAnnotations(
  node,
  fontSpecification,
  annotationMargin
) {
  const nodeAnnotationsList = node.annotations || [];
  const keyAnnotationsList = nodeAnnotationsList.filter((annotation) =>
    annotation.id?.startsWith("Key")
  );
  let totalLinesCount = keyAnnotationsList.length;
  let verticalSpacing = totalLinesCount > 0 ? 1.0 / (totalLinesCount + 1) : 0.5;
  let currentLineNumber = 1;

  for (
    let annotationIndex = 0;
    annotationIndex < nodeAnnotationsList.length;
    annotationIndex++
  ) {
    const currentAnnotation = nodeAnnotationsList[annotationIndex];
    if (!currentAnnotation.id) continue;

    let verticalOffset = currentLineNumber * verticalSpacing;

    if (currentAnnotation.id.startsWith("Key")) {
      currentAnnotation.style = {
        fontSize: 12,
        fontFamily: "Consolas",
        color: currentThemeSettings.textKeyColor,
      };
      const keyTextWidth = getTextWidth(
        currentAnnotation.content,
        fontSpecification
      );
      const keyHorizontalOffset =
        keyTextWidth / 2 / node.width + annotationMargin / node.width;
      currentAnnotation.offset = { x: keyHorizontalOffset, y: verticalOffset };
    } else {
      currentAnnotation.style = {
        fontSize: 12,
        fontFamily: "Consolas",
        color: currentThemeSettings.textValueColor,
      };
      const previousAnnotation = nodeAnnotationsList[annotationIndex - 1];
      const keyTextWidth = previousAnnotation
        ? getTextWidth(previousAnnotation.content, fontSpecification)
        : 0;
      const valueTextWidth = getTextWidth(
        currentAnnotation.content,
        fontSpecification
      );
      const keyHorizontalOffset = keyTextWidth / 2 / node.width;
      const valueHorizontalOffset =
        keyHorizontalOffset * 2 +
        valueTextWidth / 2 / node.width +
        (annotationMargin + 8) / node.width;
      if (previousAnnotation) {
        currentAnnotation.offset = {
          x: valueHorizontalOffset,
          y: verticalOffset,
        };
        currentAnnotation.content = formatDisplayValue(
          currentAnnotation.content
        );
      }
      currentLineNumber++;
    }
    applyAnnotationStyle(currentAnnotation, currentAnnotation?.content);
  }
}

// Configures annotations for parent nodes (key and count)
function configureParentNodeAnnotations(
  node,
  annotationMargin,
  expandCollapseIconWidth
) {
  const keyAnnotation = node.annotations[0];
  const countAnnotation = node.annotations[1];

  // Key Text
  keyAnnotation.content = keyAnnotation.content;
  keyAnnotation.style = {
    fontSize: 12,
    fontFamily: "Consolas",
    color: currentThemeSettings.textKeyColor,
  };
  keyAnnotation.offset = { x: showChildItemsCount ? 0 : 0.5, y: 0.5 };
  keyAnnotation.margin = {
    left: showChildItemsCount
      ? annotationMargin
      : showExpandCollapseIcon
      ? -annotationMargin
      : 0,
  };
  keyAnnotation.horizontalAlignment = showChildItemsCount ? "Left" : "Center";

  // Count Text
  if (showChildItemsCount) {
    countAnnotation.visibility = true;
    countAnnotation.content = countAnnotation.content;
    countAnnotation.style = {
      fontSize: 12,
      fontFamily: "Consolas",
      color: currentThemeSettings.textValueColor,
    };
    countAnnotation.offset = { x: 1, y: 0.5 };
    countAnnotation.horizontalAlignment = "Right";
    countAnnotation.margin = {
      right:
        annotationMargin +
        (showExpandCollapseIcon ? expandCollapseIconWidth : 0),
    };
  } else {
    countAnnotation.visibility = false;
  }
}

// Configures expand/collapse icons for non-leaf nodes
function configureExpandCollapseIcons(
  node,
  isLeafNode,
  isMainRootNode,
  expandCollapseIconWidth,
  nodeCornerRadius
) {
  if (!isLeafNode && !isMainRootNode && showExpandCollapseIcon) {
    const expandIconConfiguration = {
      shape: "Minus",
      width: expandCollapseIconWidth,
      height: node.height,
      cornerRadius: nodeCornerRadius,
      margin: { right: expandCollapseIconWidth / 2 },
      fill: currentThemeSettings.expandIconFillColor,
      borderColor: currentThemeSettings.expandIconBorder,
      iconColor: currentThemeSettings.expandIconColor,
    };
    const collapseIconConfiguration = {
      shape: "Plus",
      width: expandCollapseIconWidth,
      height: node.height,
      cornerRadius: nodeCornerRadius,
      margin: { right: expandCollapseIconWidth / 2 },
      fill: currentThemeSettings.expandIconFillColor,
      borderColor: currentThemeSettings.expandIconBorder,
      iconColor: currentThemeSettings.expandIconColor,
    };

    // Update offset based on current orientation
    updateExpandCollapseIconOffset(node);

    node.expandIcon = expandIconConfiguration;
    node.collapseIcon = collapseIconConfiguration;
  } else {
    node.expandIcon = { shape: "None", visibility: false };
    node.collapseIcon = { shape: "None", visibility: false };
  }
}

// Defines default styling and behavior for diagram connectors
function getConnectorDefaults(connector) {
  connector.constraints =
    (ej.diagrams.ConnectorConstraints.Default |
      ej.diagrams.ConnectorConstraints.ReadOnly) &
    ~(
      ej.diagrams.ConnectorConstraints.DragSourceEnd |
      ej.diagrams.ConnectorConstraints.DragTargetEnd |
      ej.diagrams.ConnectorConstraints.Select
    );
  connector.type = "Orthogonal";
  connector.style = {
    strokeColor: currentThemeSettings.connectorStrokeColor,
    strokeWidth: 2,
  };
  connector.cornerRadius = 15;
  connector.targetDecorator = { shape: "None" };
  return connector;
}

// Calculates and returns the size of the node based on its content
function calculateNodeSize(
  node,
  fontSpecification = "12px Consolas",
  nodePadding,
  textLineHeight = 16,
  expandIconWidth = 36
) {
  let maximumTextWidth = 0;
  let totalLinesCount = 0;

  const isLeafNode = node.additionalInfo?.isLeaf === true;
  const nodeAnnotations = node.annotations || [];

  if (isLeafNode) {
    const keyAnnotations = nodeAnnotations.filter((annotation) =>
      annotation.id?.startsWith("Key")
    );
    const valueAnnotations = nodeAnnotations.filter((annotation) =>
      annotation.id?.startsWith("Value")
    );
    totalLinesCount = keyAnnotations.length;

    for (let lineIndex = 0; lineIndex < totalLinesCount; lineIndex++) {
      const keyText = keyAnnotations[lineIndex]?.content || "";
      const valueText = valueAnnotations[lineIndex]?.content || "";
      const combinedKeyValueWidth = getTextWidth(
        keyText + "   " + valueText,
        fontSpecification
      );
      maximumTextWidth = Math.max(maximumTextWidth, combinedKeyValueWidth);
    }
    if (keyAnnotations.length == 0 && valueAnnotations.length == 0) {
      maximumTextWidth = Math.max(
        maximumTextWidth,
        getTextWidth(nodeAnnotations[0]?.content || " ", fontSpecification)
      );
    }
  } else if (nodeAnnotations.length === 2 && !isLeafNode) {
    const keyText = nodeAnnotations[0].content;
    const countText = nodeAnnotations[1].content;
    maximumTextWidth = getTextWidth(keyText + countText, fontSpecification);
    totalLinesCount = 1;
  }

  const calculatedWidth = Math.max(
    maximumTextWidth + nodePadding + (!isLeafNode ? expandIconWidth * 2 : 0),
    50
  );
  const calculatedHeight = Math.max(
    totalLinesCount * textLineHeight + nodePadding * 2,
    40
  );

  return {
    width: calculatedWidth,
    height: calculatedHeight,
    linesCount: totalLinesCount,
  };
}

// Applies specific styling to an annotation based on its type (Key, Value, Count)
function applyAnnotationStyle(annotation, rawAnnotationValue) {
  const annotationStyle = {
    fontFamily: "Consolas",
  };

  if (annotation.id.startsWith("Key")) {
    annotationStyle.color = currentThemeSettings.textKeyColor;
  } else if (annotation.id.startsWith("Value")) {
    annotationStyle.color = determineValueStyle(rawAnnotationValue);
  } else if (annotation.id.startsWith("Count")) {
    annotationStyle.color = currentThemeSettings.textValueColor;
  }

  annotation.style = annotationStyle;
}

// Determines the appropriate text color for a value based on its type (numeric, boolean, or default)
function determineValueStyle(rawValue) {
  if (!isNaN(parseFloat(rawValue))) {
    return currentThemeSettings.numericColor;
  } else if (
    rawValue.toLowerCase() === "true" ||
    rawValue.toLowerCase() === "false"
  ) {
    return rawValue.toLowerCase() === "true"
      ? currentThemeSettings.booleanColor
      : "red";
  }
  return currentThemeSettings.textValueColor;
}

// Formats the raw value for display by adding quotes if it is a non-empty string
function formatDisplayValue(rawValue) {
  const isStringValue =
    isNaN(rawValue) &&
    rawValue.toLowerCase() !== "true" &&
    rawValue.toLowerCase() !== "false";
  if (!isStringValue) {
    return rawValue.toLowerCase() === "true" ||
      rawValue.toLowerCase() === "false"
      ? rawValue.toLowerCase()
      : rawValue;
  }
  if (isStringValue && rawValue.trim() !== "") {
    return rawValue.startsWith('"') && rawValue.endsWith('"')
      ? rawValue
      : `"${rawValue}"`;
  }
  return rawValue;
}

// Updates the offset position for the expand/collapse icons based on the current diagram orientation
function updateExpandCollapseIconOffset(node) {
  if (node.expandIcon && node.collapseIcon) {
    if (
      currentOrientation === "LeftToRight" ||
      currentOrientation === "RightToLeft"
    ) {
      node.expandIcon.offset = node.collapseIcon.offset = {
        x: 0.5,
        y: currentOrientation === "RightToLeft" ? 0 : 1,
      };
    } else if (
      currentOrientation === "TopToBottom" ||
      currentOrientation === "BottomToTop"
    ) {
      node.expandIcon.offset = node.collapseIcon.offset = { x: 1, y: 0.5 };
    }
  }
}

// Loads the diagram with provided nodes and connectors, refresh the diagram, and fit it to the page
function loadDiagramLayout(diagramNodes, diagramConnectors) {
  setTimeout(() => {
    try {
      diagram.nodes = diagramNodes;
      diagram.connectors = diagramConnectors;
      diagram.refresh();
      diagram.fitToPage({
        mode: "Page",
        region: "Content",
        canZoomIn: true,
      });
      updateNodeCount();
      clearSearchInput();
    } catch (error) {
      console.error("Error loading diagram layout:", error);
    }
  }, 100); // Small delay to prevent UI blocking
}

// Clears the toolbar search input field
function clearSearchInput() {
  const toolbarSearchInput = document.getElementById("toolbar-search");
  if (toolbarSearchInput) {
    toolbarSearchInput.value = ""; // Clear the search input value
  }
  // Reset the search counter
  const searchCounter = document.querySelector(".search-counter");
  if (searchCounter) {
    searchCounter.style.display = "none"; // Hide the counter
  }
}

// Updates the editor status display to show whether the current content is valid or invalid
function updateEditorStatus(isValidContent) {
  const statusMessageDivs = document.querySelectorAll(".status-message > div");
  const [validStatusDiv, invalidStatusDiv] = statusMessageDivs;
  if (isValidContent) {
    validStatusDiv.style.display = "flex";
    invalidStatusDiv.style.display = "none";
    const validTextSpan = validStatusDiv.querySelector("span:nth-child(2)");
    validTextSpan.innerHTML = `Valid ${currentEditorInputType.toUpperCase()}`;
  } else {
    validStatusDiv.style.display = "none";
    invalidStatusDiv.style.display = "flex";
    const invalidTextSpan = invalidStatusDiv.querySelector("span:nth-child(2)");
    invalidTextSpan.innerHTML = `Invalid ${currentEditorInputType.toUpperCase()}`;
    if (invalidTextSpan) invalidTextSpan.style.color = "red";
  }
}

// Updates the display to show the current number of nodes in the diagram
function updateNodeCount() {
  const totalNodeCount = diagram?.nodes?.length || 0;
  const nodeCountSpan = document.querySelector(".bottom-right");
  if (nodeCountSpan) {
    nodeCountSpan.textContent = `Nodes: ${totalNodeCount}`;
  }
}

// Fetches JSON data, initializes the editor and diagram initially
fetch("./assets/sample.json")
  .then((response) => response.json())
  .then((sampleJsonData) => {
    createEditor(JSON.stringify(sampleJsonData, null, 2));
    const processedDiagramData = JsonDiagramParser.processData(sampleJsonData);
    loadDiagramLayout(
      processedDiagramData.nodes,
      processedDiagramData.connectors
    );
  })
  .catch((fetchError) => {
    console.error(fetchError);
    createEditor('{\n  "key": "value"\n}');
  });

// Handler for Diagram click
diagram.click = (clickEventArgs) => {
  if (
    clickEventArgs?.element instanceof ej.diagrams.Node &&
    clickEventArgs.element.data &&
    clickEventArgs.actualObject !== undefined
  ) {
    const clickedNodeData = clickEventArgs.element.data.actualdata;
    const nodePath = clickEventArgs.element.data.path;

    if (clickedNodeData && nodePath) {
      const nodeClickEvent = new CustomEvent("nodeDataClick", {
        detail: { content: clickedNodeData, path: nodePath },
      });
      window.dispatchEvent(nodeClickEvent);
    }
  }
};

// Export diagram as Image
window.addEventListener("exportImage", () => {
  const exportDiagramEvent = new CustomEvent("showExportDialog", {
    detail: { diagram },
  });
  window.dispatchEvent(exportDiagramEvent);
});

// Rotate Layout handler
window.addEventListener("rotateLayout", () => {
  // Cycle through the orientations
  currentOrientationIndex = (currentOrientationIndex + 1) % orientations.length;

  // Set the new orientation
  currentOrientation = orientations[currentOrientationIndex];
  diagram.layout.orientation = currentOrientation;

  diagram.nodes.forEach((diagramNode) => {
    updateExpandCollapseIconOffset(diagramNode);
  });

  // Refresh and fit diagram
  diagram.dataBind();
  diagram.fitToPage({
    mode: "Page",
    region: "Content",
    canZoomIn: true,
  });
});

// Collapse Graph Handler
window.addEventListener("collapseGraph", () => {
  const allDiagramNodes = diagram.nodes;

  if (isGraphCollapsed) {
    // Expand all nodes
    allDiagramNodes.forEach((diagramNode) => {
      if (diagramNode.isExpanded === false) {
        diagramNode.isExpanded = true;
      }
    });
    isGraphCollapsed = false;
  } else {
    // Collapse only the root nodes
    allDiagramNodes.forEach((diagramNode) => {
      if (!diagramNode.inEdges || diagramNode.inEdges.length === 0) {
        if (!diagramNode.expandIcon || diagramNode.expandIcon.shape === "None") {
          diagramNode.outEdges.forEach((outgoingEdgeId) => {
            const connectorEdge = diagram.connectors.find(
              (connector) => connector.id === outgoingEdgeId
            );
            if (connectorEdge) {
              const targetNode = allDiagramNodes.find(
                (node) => node.id === connectorEdge.targetID
              );
              if (targetNode) {
                targetNode.isExpanded = false;
              }
            }
          });
        } else {
          diagramNode.isExpanded = false;
        }
      }
    });
    isGraphCollapsed = true;
  }
});

// Reset / Fit / Zoom handlers
window.addEventListener("toolClick", (toolClickEvent) => {
  switch (toolClickEvent.detail) {
    case "reset":
      diagram.reset();
      break;
    case "fitToPage":
      diagram.reset();
      diagram.fitToPage({
        mode: "Page",
        region: "Content",
        canZoomIn: true,
      });
      break;
    case "zoomIn":
      diagram.zoomTo({ type: "ZoomIn", zoomFactor: 0.2 });
      break;
    case "zoomOut":
      diagram.zoomTo({ type: "ZoomOut", zoomFactor: 0.2 });
      break;
  }
});

// Search handler
// Search handler - manages search initialization and cleanup
var globalSearchEnterKeyHandler = null;
window.addEventListener("searchNode", (searchEvent) => {
  // reset the zoom
  diagram.reset();

  const searchQuery = searchEvent.detail.trim().toLowerCase();

  // Remove any old Enter‐key handler (if one exists)
  if (globalSearchEnterKeyHandler) {
    document.removeEventListener("keydown", globalSearchEnterKeyHandler);
    globalSearchEnterKeyHandler = null;
  }

  // First, clear all node‐styles (reset to default)
  resetAllNodeStyles();

  // If the query is empty, clear counter and return
  if (!searchQuery) {
    updateSearchCounter(0, 0);
    return;
  }

  // Process the search and handle results
  processSearchQuery(searchQuery);
});

// Processes search query, finds matches, and sets up navigation
function processSearchQuery(searchQuery) {
  // Build a fresh matches[] array
  const searchMatches = [];
  diagram.nodes.forEach((diagramNode) => {
    // assume node.data.actualdata is a string or can be stringified
    const nodeDataString =
      ("" + (diagramNode.data.actualdata || "")).toLowerCase();
    if (nodeDataString.includes(searchQuery)) {
      searchMatches.push(diagramNode.id);
    }
  });

  // A helper to highlight the "current" match and dim the rest
  let currentMatchIndex = 0;
  const focusCurrentMatch = () => {
    searchMatches.forEach((matchedNodeId, matchIndex) => {
      const matchedNodeElement = document.getElementById(
        matchedNodeId + "_content"
      );
      if (!matchedNodeElement) return;
      if (matchIndex === currentMatchIndex) {
        matchedNodeElement.style.fill =
          currentThemeSettings.highlightFocusColor;
        matchedNodeElement.style.stroke =
          currentThemeSettings.highlightStrokeColor;
        matchedNodeElement.style.strokeWidth = 2;
        // center this node in the view
        diagram.bringToCenter(
          diagram.getObject(matchedNodeId).wrapper.bounds
        );
      } else {
        matchedNodeElement.style.fill =
          currentThemeSettings.highlightFillColor;
        matchedNodeElement.style.stroke =
          currentThemeSettings.highlightStrokeColor;
        matchedNodeElement.style.strokeWidth = 1.5;
      }
    });
  };

  // If we have at least one match, show the first and attach Enter‐key navigation
  if (searchMatches.length > 0) {
    focusCurrentMatch();
    updateSearchCounter(1, searchMatches.length);

    // Define a fresh key handler (so it closes over this "matches" + "currentIndex")
    const enterKeyHandler = (keyboardEvent) => {
      if (keyboardEvent.key === "Enter") {
        currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
        focusCurrentMatch();
        updateSearchCounter(currentMatchIndex + 1, searchMatches.length);
      }
    };
    globalSearchEnterKeyHandler = enterKeyHandler;
    document.addEventListener("keydown", enterKeyHandler);
  } else {
    // No results for a non‐empty query
    updateSearchCounter(0, 0);
  }
}

// Resets all node styles to their default appearance
function resetAllNodeStyles() {
  diagram.nodes.forEach((diagramNode) => {
    const nodeElement = document.getElementById(diagramNode.id + "_content");
    if (nodeElement) {
      nodeElement.style.stroke = currentThemeSettings.nodeStrokeColor;
      nodeElement.style.fill = currentThemeSettings.nodeFillColor;
      nodeElement.style.strokeWidth = 1.5;
    }
  });
}

// update the search counter with current and total matches
function updateSearchCounter(currentMatchNumber, totalMatchesCount) {
  const searchCounterElement = document.querySelector(".search-counter");
  if (searchCounterElement) {
    searchCounterElement.textContent = `${currentMatchNumber} / ${totalMatchesCount}`;
  }
}

// File menu handlers
document.addEventListener("fileAction", function (fileActionEvent) {
  const fileAction = fileActionEvent.detail;
  if (fileAction === "import") {
    importFromFile()
      .then((importedFileContent) => {
  try {
          editor.setValue(importedFileContent); // Update the Monaco editor with imported content

          let processedDiagramData;
          if (currentEditorInputType.toLowerCase() === "json") {
            const parsedJsonData = JSON.parse(importedFileContent);
            processedDiagramData =
              JsonDiagramParser.processData(parsedJsonData);
          } else if (currentEditorInputType.toLowerCase() === "xml") {
            // Convert XML to JSON first, then process using JsonDiagramParser
            const wrappedXmlContent = `<root>${importedFileContent}</root>`;
            const parsedXmlAsJson = xmlParser.parse(wrappedXmlContent);

            // Use only the content under root
            const extractedJsonData = parsedXmlAsJson.root || {};
            processedDiagramData =
              JsonDiagramParser.processData(extractedJsonData);
          }

          if (processedDiagramData) {
            loadDiagramLayout(
              processedDiagramData.nodes,
              processedDiagramData.connectors
            );
            updateEditorStatus(true);
          }
        } catch (importError) {
          console.error("Error during import:", importError);
          updateEditorStatus(false);
        }
      })
      .catch((importFailureError) => {
        console.error("Import failed:", importFailureError);
        hideSpinner();
      });
  } else if (fileAction === "export") {
    showSpinner(); // Show spinner when starting the export
    const editorContentToExport = editor.getValue() || "";
    const exportFileExtension = currentEditorInputType.toLowerCase();
    exportToFile(editorContentToExport, `Diagram.${exportFileExtension}`);
    hideSpinner(); // Hide spinner after export
  }
});

// Import file as JSON or XML
function importFromFile() {
  return new Promise((resolve, reject) => {
    const fileInputElement = document.createElement("input");
    fileInputElement.type = "file";
    fileInputElement.accept =
      currentEditorInputType.toLowerCase() === "json" ? ".json" : ".xml"; // Accept input type based on current editor input type
    fileInputElement.onchange = async (fileChangeEvent) => {
      const selectedFile = fileChangeEvent.target.files[0];
      if (selectedFile) {
        const fileReader = new FileReader();
        fileReader.onload = (fileLoadEvent) => {
          resolve(fileLoadEvent.target.result);
      };
        fileReader.onerror = () => {
          reject("Error reading the file");
        };
        fileReader.readAsText(selectedFile);
      } else {
        reject("No file selected");
      }
    };
    fileInputElement.click();
  });
}

// Export file as JSON or XML
function exportToFile(dataToExport, exportFileName) {
  try {
    const exportBlob = new Blob([dataToExport], { type: "text/plain" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(exportBlob);
    downloadLink.download = exportFileName || "data.txt";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (exportError) {
    console.error("Export failed:", exportError);
  }
}

// View menu handlers
document.addEventListener("viewOptionToggled", function (viewOptionEvent) {
  const selectedOptionId = viewOptionEvent.detail;
  switch (selectedOptionId) {
    case "view-grid":
      if (
        diagram.snapSettings.constraints & ej.diagrams.SnapConstraints.ShowLines
      ) {
        diagram.snapSettings.constraints &=
          ~ej.diagrams.SnapConstraints.ShowLines;
      } else {
        diagram.snapSettings.constraints |=
          ej.diagrams.SnapConstraints.ShowLines;
      }
      break;
    case "view-count":
      showChildItemsCount = !showChildItemsCount;
      diagram.refresh();
      break;
    case "expand-collapse":
      showExpandCollapseIcon = !showExpandCollapseIcon;
      diagram.refresh();
      break;
  }
  diagram.fitToPage({
    mode: "Page",
    region: "Content",
    margin: {},
    canZoomIn: true,
  });
});

// Theme menu handlers
document.addEventListener("themeChanged", function (themeChangeEvent) {
  const selectedTheme = themeChangeEvent.detail;
  themeService.setTheme(selectedTheme);
  currentThemeSettings = themeService.getCurrentThemeSettings();
  monaco.editor.setTheme(selectedTheme === "dark" ? "vs-dark" : "vs");
  updateCDNLinks(selectedTheme);
  updateDiagramElements(currentThemeSettings);
  document.body.classList.toggle("dark-theme", selectedTheme === "dark");
  clearSearchInput();
});

// Updates the theme stylesheet link to switch between dark and light tailwind themes
function updateCDNLinks(themeName) {
  const themeStylesheetLink = document.getElementById("theme-link");
  if (themeStylesheetLink) {
    let stylesheetHref = themeStylesheetLink.href;
    if (themeName === "dark") {
      stylesheetHref = stylesheetHref.replace(
        /tailwind(\.css)/g,
        "tailwind-dark$1"
      );
    } else {
      stylesheetHref = stylesheetHref.replace(
        /tailwind-dark(\.css)/g,
        "tailwind$1"
      );
    }
    themeStylesheetLink.href = stylesheetHref;
  }
}

// Updates the diagram elements and layout based on the provided theme settings
function updateDiagramElements(appliedThemeSettings) {
  diagram.backgroundColor = appliedThemeSettings.diagramBackgroundColor;
  diagram.snapSettings.verticalGridlines.lineColor =
    appliedThemeSettings.theme === "dark" ? "rgb(45, 45, 45)" : "#EBE8E8";
  diagram.snapSettings.horizontalGridlines.lineColor =
    appliedThemeSettings.theme === "dark" ? "rgb(45, 45, 45)" : "#EBE8E8";

  // Refresh diagram layout
  diagram.refresh();
  diagram.fitToPage({
    mode: "Page",
    region: "Content",
    canZoomIn: true,
  });
}

// Handles editor type change events, updates the editor language, and parses the content to update the diagram layout
document.addEventListener("editorTypeChanged", (editorTypeChangeEvent) => {
  // Update the current editor input type based on the selected option
  currentEditorInputType = editorTypeChangeEvent.detail.toLowerCase();
  monaco.editor.setModelLanguage(
    editor.getModel(),
    currentEditorInputType
  );

  // Retrieve the current content in the editor
  const currentEditorContent = editor.getValue();
  let convertedDiagramData;
  const navigationTitle = document.querySelector(".nav-title");

  // Update the navigation bar title to reflect the current editor input type
  if (navigationTitle) {
    navigationTitle.textContent = `${currentEditorInputType.toUpperCase()} To Diagram`;
  }

  // Function to check for syntax errors in the editor content
  const checkForSyntaxErrors = () => {
    const editorModel = editor.getModel();
    const syntaxErrorMarkers = monaco.editor.getModelMarkers({
      resource: editorModel.uri,
    });
    return syntaxErrorMarkers.length === 0; // No errors if markers array is empty
  };

  try {
    if (currentEditorInputType === "json" && checkForSyntaxErrors()) {
      // Convert from XML to JSON when switching to JSON editor type
      const xmlToJsonObject = xmlParser.parse(currentEditorContent); // Parse the existing XML content to JSON
      setTimeout(() => {
        editor.setValue(JSON.stringify(xmlToJsonObject, null, 2)); // Set the converted JSON in the editor
      }, 0);
      convertedDiagramData = JsonDiagramParser.processData(
        xmlToJsonObject
      ); // Process the JSON data using JsonDiagramParser
      updateEditorStatus(true); // Update editor status to valid
    } else if (currentEditorInputType === "xml" && checkForSyntaxErrors()) {
      // Convert from JSON to XML when switching to XML editor type
      const jsonToXmlObject = JSON.parse(currentEditorContent); // Parse the existing JSON content
      const xmlBuilderOptions = {
        format: true, // Enable formatting for XML
        indentBy: "  ", // Indent with two spaces
        supressEmptyNode: true, // Suppress self-closing tags for empty nodes
      };
      const xmlBuilder = new XMLBuilder(xmlBuilderOptions);
      const convertedXmlContent = xmlBuilder.build(jsonToXmlObject); // Convert JSON to XML
      setTimeout(() => {
        editor.setValue(convertedXmlContent); // Set the converted XML in the editor
      }, 0);
      convertedDiagramData = JsonDiagramParser.processData(
        jsonToXmlObject
      ); // Process the original JSON data using JsonDiagramParser
      updateEditorStatus(true); // Update editor status to valid
  }
  } catch (conversionError) {
    console.error("Parsing Error:", conversionError); // Log parsing errors
    updateEditorStatus(false); // Update status to invalid on error
  }

  // Load the diagram with the nodes and connectors, if diagram data is available
  if (convertedDiagramData) {
    loadDiagramLayout(
      convertedDiagramData.nodes,
      convertedDiagramData.connectors
    );
  }
});
