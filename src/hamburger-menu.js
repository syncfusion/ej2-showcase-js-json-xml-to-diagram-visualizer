// Enable ripple effect for UI components
ej.base.enableRipple(true);

export function initHamburgerMenu(getGraphCollapseState) {
  // Define menu items configuration with text, id, and icon properties
  const hamburgerMenuItems = [
    { text: 'Export as Image', id: 'exportImage', iconCss: 'e-icons e-export' },
    { text: 'Rotate Layout', id: 'rotateLayout', iconCss: 'e-icons e-refresh' },
    { text: 'Collapse Graph', id: 'collapseGraph', iconCss: 'e-icons e-collapse-2' }
  ];

  // Initialize dropdown button component with menu configuration
  const hamburgerDropdownButton = new ej.splitbuttons.DropDownButton({
    iconCss: 'e-icons e-menu',
    cssClass: 'e-caret-hide',
    items: hamburgerMenuItems,
    // Handle menu item selection and dispatch corresponding events
    select: function(menuSelectionArgs) {
      switch (menuSelectionArgs.item.id) {
        case 'exportImage':
          window.dispatchEvent(new CustomEvent('exportImage'));
          break;
        case 'rotateLayout':
          window.dispatchEvent(new CustomEvent('rotateLayout'));
          break;
        case 'collapseGraph':
          window.dispatchEvent(new CustomEvent('collapseGraph'));
          updateCollapseMenuText();
          break;
      }
    }
  });

  // Toggle menu text and icon based on current graph collapse state
  function updateCollapseMenuText() {
    const isCurrentlyCollapsed = getGraphCollapseState();
    const collapseMenuItem = hamburgerMenuItems.find(menuItem => menuItem.id === 'collapseGraph');
    if (collapseMenuItem) {
      collapseMenuItem.text = isCurrentlyCollapsed ? 'Expand Graph' : 'Collapse Graph';
      collapseMenuItem.iconCss = isCurrentlyCollapsed ? 'e-icons e-expand' : 'e-icons e-collapse-2';
      hamburgerDropdownButton.items = hamburgerMenuItems;
      hamburgerDropdownButton.dataBind();
    }
  }

  // Append the hamburger menu to the designated DOM element
  hamburgerDropdownButton.appendTo('#hamburger-menu');
}