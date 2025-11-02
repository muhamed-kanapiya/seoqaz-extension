# SEOQaz - SEO Analyzer Chrome Extension

A powerful Chrome extension for analyzing and optimizing SEO elements on any webpage.

## Features

- **Title Tag Analysis**: Check if your title tag meets SEO best practices (30-60 characters)
- **Meta Description Analysis**: Verify meta description length (120-160 characters recommended)
- **Heading Structure**: Analyze H1-H4 tags and ensure proper hierarchy
- **Image Optimization**: Identify images missing alt text
- **Link Analysis**: Count internal, external, and nofollow links
- **Open Graph Tags**: Verify social media sharing tags (og:title, og:description, og:image, og:url)
- **SEO Score**: Get an overall SEO score out of 100

## Installation

### Method 1: Install from Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon.

### Method 2: Load Unpacked Extension (For Development)

1. Clone this repository or download the ZIP file:
   ```bash
   git clone https://github.com/muhamed-kanapiya/seoqaz-extension.git
   ```

2. Open Google Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top-right corner

4. Click "Load unpacked" button

5. Select the `seoqaz-extension` folder from your local machine

6. The SEOQaz extension icon should now appear in your Chrome toolbar

## Usage

1. Navigate to any webpage you want to analyze

2. Click the SEOQaz extension icon in your Chrome toolbar

3. Click the "Analyze Page" button in the popup

4. Review the detailed SEO analysis:
   - **Title Tag**: Length and quality check
   - **Meta Description**: Length and presence
   - **Headings**: H1-H4 count and structure
   - **Images**: Total count and alt text coverage
   - **Links**: Internal vs. external links breakdown
   - **Open Graph**: Social media tags verification
   - **SEO Score**: Overall score with recommendations

## What Gets Analyzed

### Title Tag
- ✅ Optimal: 30-60 characters
- ⚠️ Warning: Too short (<30) or too long (>60)
- ❌ Error: Missing title

### Meta Description
- ✅ Optimal: 120-160 characters
- ⚠️ Warning: Too short or too long
- ❌ Error: Missing description

### Headings
- ✅ Best practice: Exactly one H1 tag
- ⚠️ Warning: Multiple H1 tags or missing H1
- Multiple H2, H3, H4 tags are acceptable

### Images
- ✅ All images have alt text
- ⚠️ Some images missing alt text
- Shows percentage of images with missing alt attributes

### Links
- Total links count
- Internal links (same domain)
- External links (different domains)
- Nofollow links count

### Open Graph Tags
- og:title
- og:description
- og:image
- og:url

### SEO Score Ranges
- 🌟 90-100: Excellent SEO
- ✅ 70-89: Good SEO
- ⚠️ 50-69: Needs Improvement
- ❌ 0-49: Poor SEO

## Technologies Used

- **Manifest V3**: Latest Chrome extension API
- **JavaScript**: Core functionality
- **HTML/CSS**: User interface
- **Chrome APIs**: Tabs, Scripting

## Development

### File Structure
```
seoqaz-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.css           # Popup styling
├── popup.js            # Popup logic and SEO analysis
├── content.js          # Content script (runs on web pages)
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Documentation
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this extension for personal or commercial projects.

## Privacy

This extension:
- Does NOT collect any personal data
- Does NOT send data to external servers
- Analyzes pages locally in your browser
- Only accesses the active tab when you click "Analyze Page"

## Support

If you encounter any issues or have suggestions, please open an issue on GitHub.

## Roadmap

Future enhancements may include:
- Schema markup detection
- Mobile-friendliness check
- Page speed insights
- Keyword density analysis
- Social media tags validation
- Export reports as PDF
- Historical tracking of SEO scores