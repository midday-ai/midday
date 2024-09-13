# @midday/assets

## Description
Solomon's comprehensive asset package for web projects, featuring custom fonts and utility classes.

## Version
0.1.0

## License
MIT

## Author
Solomon

## Contents
This package includes the following assets:

- Custom fonts (Geist Sans and Geist Mono)
- CSS stylesheet for font integration
- Utility classes for typography

## Fonts

### 1. Geist Sans
- Type: Variable font
- Weight range: 100-900
- Style: Normal
- Use case: Primary font for body text, headings, and UI elements

### 2. Geist Mono
- Type: Variable font
- Weight range: 100-900
- Style: Normal
- Use case: Monospaced font for code snippets, terminal output, and tabular data

## Installation

Install the package using npm:

```bash
npm install @midday/assets
```

## Usage

### Importing Fonts
To use the fonts in your project, import the stylesheet in your main CSS or JavaScript file:

```css
@import '@midday/assets/fonts/stylesheet.css';
```

or in JavaScript:

```javascript
import '@midday/assets/fonts/stylesheet.css';
```

### Using Fonts in CSS
After importing, you can use the custom properties to apply the fonts:

```css
body {
  font-family: var(--font-geist-sans);
}

code {
  font-family: var(--font-geist-mono);
}
```

### Utility Classes
The package provides utility classes for quick typography styling:

- `.light-text`: Applies a light font weight (300)
- `.bold-text`: Applies a bold font weight (700)
- `.extra-bold-text`: Applies an extra bold font weight (900)

Example:
```html
<p class="light-text">This text is light.</p>
<p class="bold-text">This text is bold.</p>
<p class="extra-bold-text">This text is extra bold.</p>
```

## Variable Font Usage
Geist Sans and Geist Mono are variable fonts, allowing fine-grained control over font weight. You can use any weight between 100 and 900:

```css
.custom-weight {
  font-weight: 550; /* Any value between 100 and 900 */
}
```

## Browser Support
The variable fonts are supported in all modern browsers. For older browsers, consider providing fallback fonts:

```css
body {
  font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
}
```

## Performance Considerations
The stylesheet uses `font-display: swap` to ensure text remains visible during font loading, improving perceived performance.

## Contributing
We welcome contributions to improve the @midday/assets package. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on our code of conduct and the process for submitting pull requests.

## Support
If you encounter any issues or have questions, please file an issue on our GitHub repository.