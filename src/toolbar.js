// Enable ripple effect for UI components
ej.base.enableRipple(true);
ej.navigations.Toolbar.Inject();
ej.inputs.TextBox.Inject();

// Initialize toolbar with zoom controls and search functionality
export function initToolBar() {
  // Define toolbar button configurations for zoom operations
  const zoomToolbarItems = [
    {
      prefixIcon: "e-icons e-reset",
      tooltipText: "Reset Zoom",
      id: "reset",
      cssClass: "e-flat toolbar-btn",
    },
    {
      prefixIcon: "e-icons e-zoom-to-fit",
      tooltipText: "Fit To Page",
      id: "fitToPage",
      cssClass: "e-flat toolbar-btn",
    },
    {
      prefixIcon: "e-icons e-zoom-in",
      tooltipText: "Zoom In",
      id: "zoomIn",
      cssClass: "e-flat toolbar-btn",
    },
    {
      prefixIcon: "e-icons e-zoom-out",
      tooltipText: "Zoom Out",
      id: "zoomOut",
      cssClass: "e-flat toolbar-btn",
    },
  ];

  // Create toolbar component with zoom control buttons
  const zoomControlToolbar = new ej.navigations.Toolbar({
    overflowMode: "Extended",
    items: zoomToolbarItems,
    clicked: function (toolbarClickArgs) {
      window.dispatchEvent(
        new CustomEvent("toolClick", { detail: toolbarClickArgs.item.id })
      );
    },
  });

  // Append toolbar to designated container
  zoomControlToolbar.appendTo("#toolbar");

  // Create search input component with icon and counter
  const nodeSearchTextBox = new ej.inputs.TextBox({
    placeholder: "Search Node",
    created: function () {
      // Add search icon to input field
      const searchIconElement = document.createElement("span");
      searchIconElement.className = "e-input-group-icon e-icons e-search";
      document.querySelector("#toolbar-search").appendChild(searchIconElement);
      nodeSearchTextBox.addIcon("prepend", "e-icons e-search search-icon");
      
      // Create counter element for search results display
      const searchResultCounter = document.createElement("span");
      searchResultCounter.style.fontSize = ".75rem";
      searchResultCounter.className = "e-input-group-icon counter-icon search-counter";
      document.querySelector(".search-bar-container .e-input-group").appendChild(searchResultCounter);
    },
    input: function (searchInputEvent) {
      const searchQueryText = searchInputEvent.value.trim();
      // Show or hide the counter based on the search query
      const searchCounterElement = document.querySelector(".search-counter");
      if (searchCounterElement) {
        searchCounterElement.style.display = searchQueryText ? "flex" : "none"; // Toggle visibility
      }
      window.dispatchEvent(new CustomEvent("searchNode", { detail: searchQueryText }));
    },
  });
  
  // Append search box to designated container
  nodeSearchTextBox.appendTo("#toolbar-search");
}