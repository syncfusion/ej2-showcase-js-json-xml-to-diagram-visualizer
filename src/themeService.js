class ThemeSettings {
    constructor(theme = 'light') {
        this.theme = theme;
        this.diagramBackgroundColor = theme === 'light' ? "#F8F9FA" : "#1e1e1e";
        this.gridlinesColor = theme === 'light' ? "#EBE8E8" : "rgb(45, 45, 45)";
        this.nodeFillColor = theme === 'light' ? "rgb(255, 255, 255)" : "rgb(41, 41, 41)";
        this.nodeStrokeColor = theme === 'light' ? "rgb(188, 190, 192)" : "rgb(66, 66, 66)";
        this.textKeyColor = theme === 'light' ? "#A020F0" : "#4dabf7";
        this.textValueColor = theme === 'light' ? "rgb(83, 83, 83)" : "rgb(207, 227, 225)";
        this.textValueNullColor = theme === 'light' ? "rgb(41, 41, 41)" : "rgb(151, 150, 149)";
        this.expandIconFillColor = theme === 'light' ? "#e0dede" : "#1e1e1e";
        this.expandIconColor = theme === 'light' ? "rgb(46, 51, 56)" : "rgb(220, 221, 222)";
        this.expandIconBorder = theme === 'light' ? "rgb(188, 190, 192)" : "rgb(66, 66, 66)";
        this.connectorStrokeColor = theme === 'light' ? "rgb(188, 190, 192)" : "rgb(66, 66, 66)";
        this.childCountColor = theme === 'light' ? "rgb(41, 41, 41)" : "rgb(255, 255, 255)";
        this.booleanColor = theme === 'light' ? "rgb(74, 145, 67)" : "rgb(61, 226, 49)";
        this.numericColor = theme === 'light' ? "rgb(182, 60, 30)" : "rgb(232, 196, 121)";
        this.popupKeyColor = theme === 'light' ? "#5C940D" : "#A5D8FF";
        this.popupValueColor = theme === 'light' ? "#1864AB" : "#40C057";
        this.popupContentBGColor = theme === 'light' ? "#F8F9FA" : "#1A1A1A";
        this.highlightFillColor = theme === 'light' ? "rgba(27, 255, 0, 0.1)" : "rgba(27, 255, 0, 0.1)";
        this.highlightFocusColor = theme === 'light' ? "rgba(252, 255, 166, 0.57)" : "rgba(82, 102, 0, 0.61)";
        this.highlightStrokeColor = theme === 'light' ? "rgb(0, 135, 54)" : "rgb(0, 135, 54)";
    }
}

class ThemeService {
    constructor() {
        this.currentTheme = 'light';
        this.currentThemeSettings = new ThemeSettings(this.currentTheme);
        this.onThemeChangedCallbacks = [];
    }

    // Set a new theme and update settings
    setTheme(theme) {
        this.currentTheme = theme;
        this.currentThemeSettings = new ThemeSettings(theme);
    }
    
    // Get the current theme name ('light' or 'dark')
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Get the current theme settings object
    getCurrentThemeSettings() {
        return this.currentThemeSettings;
    }
}

// Create a global theme service instance
const themeService = new ThemeService();
export default themeService;