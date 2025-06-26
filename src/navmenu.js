export function initNavbar() {
    // Enable ripple effect for UI components
    ej.base.enableRipple(true);
    const activeViewOptionsSet = new Set(['view-grid', 'view-count', 'expand-collapse']);
    let currentSelectedTheme = 'Light';
    
    // Toggle icon class for menu items and update active state
    function toggleMenuItemIconClass(activeItemsSet, selectedMenuItem) {
        if (activeItemsSet.has(selectedMenuItem.id)) {
            activeItemsSet.delete(selectedMenuItem.id);
            return '';
        } else {
            activeItemsSet.add(selectedMenuItem.id);
            return 'e-icons e-check';
        }
    }

    // Dispatch custom events with provided event name and data
    function dispatchCustomEvent(customEventName, eventDetailData) {
        const customEvent = new CustomEvent(customEventName, { detail: eventDetailData });
        document.dispatchEvent(customEvent);
    }

    // Initialize editor type dropdown with JSON/XML options
    new ej.dropdowns.DropDownList({
        width: '90px',
        dataSource: [
          { text: 'JSON', value: 'json' },
          { text: 'XML',  value: 'xml'  }
        ],
        fields: { text: 'text', value: 'value' },
        value: 'json',
        change: (editorChangeEvent) => {
          dispatchCustomEvent('editorTypeChanged', editorChangeEvent.value);
        }
      }).appendTo('#editor-type');
      
    // Initialize file operations dropdown with import/export options
    new ej.splitbuttons.DropDownButton({
        items: [
            { text: 'Import', id: 'import', iconCss: 'e-icons e-import' },
            { text: 'Export', id: 'export', iconCss: 'e-icons e-export' }
        ],
        select: function (fileActionArgs) {
            dispatchCustomEvent('fileAction', fileActionArgs.item.id);
        }
    }).appendTo('#file-ddb');

    // Initialize view options dropdown with toggleable display settings
    new ej.splitbuttons.DropDownButton({
        items: [
            { text: 'Show Grid', id: 'view-grid', iconCss: 'e-icons e-check' },
            { text: 'Item Count', id: 'view-count', iconCss: 'e-icons e-check' },
            { text: 'Show Expand/Collapse', id: 'expand-collapse', iconCss: 'e-icons e-check' }
        ],
        select: function (viewOptionArgs) {
             const updatedIconClass = toggleMenuItemIconClass(activeViewOptionsSet, viewOptionArgs.item);
             viewOptionArgs.item.iconCss = updatedIconClass;
             this.setProperties({items: this.items}, true);
             dispatchCustomEvent('viewOptionToggled', viewOptionArgs.item.id);
        }
    }).appendTo('#view-ddb');

    // Initialize theme selector dropdown with light/dark theme options
    new ej.splitbuttons.DropDownButton({
        items: [
            { text: 'Light', id: 'light', iconCss: currentSelectedTheme === 'Light' ? 'e-icons e-check' : '' },
            { text: 'Dark', id: 'dark', iconCss: currentSelectedTheme === 'Dark' ? 'e-icons e-check' : '' }
        ],
        select: function (themeSelectionArgs) {
            const isDarkThemeSelected = themeSelectionArgs.item.text === 'Dark';
            currentSelectedTheme = isDarkThemeSelected ? 'Dark' : 'Light';
            document.body.classList.toggle('dark', isDarkThemeSelected);

            // Update the theme selection icons
            this.setProperties({items: this.items.map(themeItem => ({
                ...themeItem,
                iconCss: themeItem.id === themeSelectionArgs.item.id ? 'e-icons e-check' : ''
            }))}, true);

            dispatchCustomEvent('themeChanged', themeSelectionArgs.item.id);
        }
    }).appendTo('#theme-ddb');
}