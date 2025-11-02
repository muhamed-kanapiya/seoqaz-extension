// SEO Analysis Script for Popup
document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  
  // Initialize theme
  initTheme();
  
  // Theme toggle event listener
  themeToggle.addEventListener('click', toggleTheme);
  analyzeBtn.addEventListener('click', analyzePage);

  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.className = savedTheme;
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = body.className;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.className = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    if (theme === 'dark') {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    } else {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    }
  }

  async function analyzePage() {
    // Show loading state
    loading.classList.remove('hidden');
    results.classList.add('hidden');

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if it's a Google search page
      const isGoogleSearch = tab.url && tab.url.includes('google.com/search');

      // Execute the content script to get SEO data
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: isGoogleSearch ? extractGoogleSERPData : extractSEOData
      });

      const seoData = result.result;

      // Display the results
      if (isGoogleSearch) {
        displaySERPResults(seoData);
      } else {
        displayResults(seoData);
      }

      // Hide loading and show results
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } catch (error) {
      console.error('Error analyzing page:', error);
      alert('Error analyzing page. Please try again.');
      loading.classList.add('hidden');
    }
  }

  function displaySERPResults(data) {
    const serpSection = document.getElementById('serp-section');
    const serpInfo = document.getElementById('serp-info');
    
    serpSection.classList.remove('hidden');
    
    if (data.results && data.results.length > 0) {
      let html = `<div class="metric-row">
        <span class="metric-label">Total Results Found:</span>
        <span class="metric-value">${data.totalResults || data.results.length}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Search Query:</span>
        <span class="metric-value">${data.query || 'N/A'}</span>
      </div>
      <div style="margin-top: 16px;">
        <strong style="display: block; margin-bottom: 12px;">Top ${Math.min(data.results.length, 10)} Results:</strong>`;
      
      data.results.slice(0, 10).forEach((result, index) => {
        html += `
          <div class="serp-result">
            <div class="serp-position">Position #${index + 1}</div>
            ${result.url ? `<div class="serp-url">${result.url}</div>` : ''}
            ${result.title ? `<div class="serp-title">${result.title}</div>` : ''}
            ${result.snippet ? `<div class="serp-snippet">${result.snippet}</div>` : ''}
          </div>
        `;
      });
      
      html += `</div>`;
      serpInfo.innerHTML = html;
    } else {
      serpInfo.innerHTML = '<p class="status-warning">⚠️ No search results found on this page.</p>';
    }
    
    // Hide other sections for SERP pages
    const scoreInfo = document.getElementById('score-info');
    scoreInfo.innerHTML = '<p style="text-align: center; color: hsl(var(--muted-foreground));">SERP analysis mode - SEO score not applicable</p>';
    
    // Hide other cards
    document.querySelectorAll('.card').forEach((card, index) => {
      if (index > 1) { // Keep score and SERP cards
        card.style.display = 'none';
      }
    });
  }

  function displayResults(data) {
    // Show all cards
    document.querySelectorAll('.card').forEach(card => {
      card.style.display = 'block';
    });
    
    // Hide SERP section
    const serpSection = document.getElementById('serp-section');
    serpSection.classList.add('hidden');
    
    // Ensure data properties exist with defaults
    const title = data.title || '';
    const metaDescription = data.metaDescription || '';
    const headings = data.headings || { h1: 0, h2: 0, h3: 0, h4: 0 };
    const images = data.images || { total: 0, missingAlt: 0 };
    const links = data.links || { total: 0, internal: 0, external: 0, nofollow: 0 };
    const openGraph = data.openGraph || { title: '', description: '', image: '', url: '' };
    
    // Calculate and display SEO Score first
    const scoreInfo = document.getElementById('score-info');
    const score = calculateSEOScore(data);
    scoreInfo.innerHTML = `
      <div class="score-value">${score}/100</div>
      <div class="score-label">${getScoreLabel(score)}</div>
    `;
    
    // Title Tag Analysis
    const titleInfo = document.getElementById('title-info');
    const titleLength = title.length;
    let titleStatus = '';
    if (titleLength === 0) {
      titleStatus = '<span class="status-error">❌ Missing</span>';
    } else if (titleLength < 30) {
      titleStatus = '<span class="status-warning">⚠️ Too short</span>';
    } else if (titleLength > 60) {
      titleStatus = '<span class="status-warning">⚠️ Too long</span>';
    } else {
      titleStatus = '<span class="status-good">✅ Good</span>';
    }
    titleInfo.innerHTML = `
      <div class="metric-row">
        <span class="metric-label">Title:</span>
        <span class="metric-value">${title || '<em>Not found</em>'}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Length:</span>
        <span class="metric-value">${titleLength} characters ${titleStatus}</span>
      </div>
      <small style="color: hsl(var(--muted-foreground));">Recommended: 30-60 characters</small>
    `;

    // Meta Description Analysis
    const metaDescInfo = document.getElementById('meta-description-info');
    const descLength = metaDescription.length;
    let descStatus = '';
    if (descLength === 0) {
      descStatus = '<span class="status-error">❌ Missing</span>';
    } else if (descLength < 120) {
      descStatus = '<span class="status-warning">⚠️ Too short</span>';
    } else if (descLength > 160) {
      descStatus = '<span class="status-warning">⚠️ Too long</span>';
    } else {
      descStatus = '<span class="status-good">✅ Good</span>';
    }
    metaDescInfo.innerHTML = `
      <div class="metric-row">
        <span class="metric-label">Description:</span>
        <span class="metric-value">${metaDescription || '<em>Not found</em>'}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Length:</span>
        <span class="metric-value">${descLength} characters ${descStatus}</span>
      </div>
      <small style="color: hsl(var(--muted-foreground));">Recommended: 120-160 characters</small>
    `;

    // Headings Analysis
    const headingsInfo = document.getElementById('headings-info');
    const h1Status = headings.h1 === 1 ? '<span class="status-good">✅ Good</span>' :
                     headings.h1 === 0 ? '<span class="status-error">❌ Missing</span>' :
                     '<span class="status-warning">⚠️ Multiple H1 tags</span>';
    headingsInfo.innerHTML = `
      <div class="metric-row">
        <span class="metric-label">H1:</span>
        <span class="metric-value">${headings.h1} ${h1Status}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">H2:</span>
        <span class="metric-value">${headings.h2}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">H3:</span>
        <span class="metric-value">${headings.h3}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">H4:</span>
        <span class="metric-value">${headings.h4}</span>
      </div>
      <small style="color: hsl(var(--muted-foreground));">Best practice: Use exactly one H1 tag per page</small>
    `;

    // Images Analysis
    const imagesInfo = document.getElementById('images-info');
    const missingAltPercent = images.total > 0 
      ? Math.round((images.missingAlt / images.total) * 100)
      : 0;
    const altStatus = images.missingAlt === 0 ? '<span class="status-good">✅ All images have alt text</span>' :
                      '<span class="status-warning">⚠️ Some images missing alt text</span>';
    imagesInfo.innerHTML = `
      <div class="metric-row">
        <span class="metric-label">Total Images:</span>
        <span class="metric-value">${images.total}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Missing Alt Text:</span>
        <span class="metric-value">${images.missingAlt} (${missingAltPercent}%) ${altStatus}</span>
      </div>
      <small style="color: hsl(var(--muted-foreground));">All images should have descriptive alt text for SEO and accessibility</small>
    `;

    // Links Analysis
    const linksInfo = document.getElementById('links-info');
    linksInfo.innerHTML = `
      <div class="metric-row">
        <span class="metric-label">Total Links:</span>
        <span class="metric-value">${links.total}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Internal Links:</span>
        <span class="metric-value">${links.internal}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">External Links:</span>
        <span class="metric-value">${links.external}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Nofollow Links:</span>
        <span class="metric-value">${links.nofollow}</span>
      </div>
      <small style="color: hsl(var(--muted-foreground));">Good internal linking structure helps SEO</small>
    `;

    // Open Graph Tags
    const ogInfo = document.getElementById('og-info');
    const ogStatus = (openGraph.title && openGraph.description && openGraph.image) 
      ? '<span class="status-good">✅ Essential tags present</span>'
      : '<span class="status-warning">⚠️ Missing some tags</span>';
    ogInfo.innerHTML = `
      <div class="metric-row">
        <span class="metric-label">og:title:</span>
        <span class="metric-value">${openGraph.title || '<em>Not found</em>'}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">og:description:</span>
        <span class="metric-value">${openGraph.description || '<em>Not found</em>'}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">og:image:</span>
        <span class="metric-value">${openGraph.image ? '✅ Present' : '<em>Not found</em>'}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">og:url:</span>
        <span class="metric-value">${openGraph.url || '<em>Not found</em>'}</span>
      </div>
      <div style="margin-top: 8px;">${ogStatus}</div>
    `;
  }

  function calculateSEOScore(data) {
    let score = 0;
    
    // Safely access properties with defaults
    const title = data.title || '';
    const metaDescription = data.metaDescription || '';
    const headings = data.headings || { h1: 0, h2: 0, h3: 0, h4: 0 };
    const images = data.images || { total: 0, missingAlt: 0 };
    const openGraph = data.openGraph || { title: '', description: '', image: '', url: '' };

    // Title (20 points)
    if (title.length >= 30 && title.length <= 60) {
      score += 20;
    } else if (title.length > 0) {
      score += 10;
    }

    // Meta Description (20 points)
    if (metaDescription.length >= 120 && metaDescription.length <= 160) {
      score += 20;
    } else if (metaDescription.length > 0) {
      score += 10;
    }

    // H1 Tag (15 points)
    if (headings.h1 === 1) {
      score += 15;
    } else if (headings.h1 > 0) {
      score += 8;
    }

    // Heading Structure (10 points)
    if (headings.h2 > 0) {
      score += 10;
    }

    // Images Alt Text (15 points)
    if (images.total > 0) {
      const altRatio = (images.total - images.missingAlt) / images.total;
      score += Math.round(15 * altRatio);
    } else {
      score += 15; // No images is fine
    }

    // Open Graph Tags (20 points)
    let ogScore = 0;
    if (openGraph.title) ogScore += 5;
    if (openGraph.description) ogScore += 5;
    if (openGraph.image) ogScore += 5;
    if (openGraph.url) ogScore += 5;
    score += ogScore;

    return score;
  }

  function getScoreLabel(score) {
    if (score >= 90) return '🌟 Excellent SEO!';
    if (score >= 70) return '✅ Good SEO';
    if (score >= 50) return '⚠️ Needs Improvement';
    return '❌ Poor SEO';
  }
});

// This function runs in the context of the web page
function extractSEOData() {
  const data = {
    title: document.title || '',
    metaDescription: '',
    headings: {
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
      h4: document.querySelectorAll('h4').length
    },
    images: {
      total: 0,
      missingAlt: 0
    },
    links: {
      total: 0,
      internal: 0,
      external: 0,
      nofollow: 0
    },
    openGraph: {
      title: '',
      description: '',
      image: '',
      url: ''
    }
  };

  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    data.metaDescription = metaDesc.getAttribute('content') || '';
  }

  // Analyze images
  const images = document.querySelectorAll('img');
  data.images.total = images.length;
  images.forEach(img => {
    if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
      data.images.missingAlt++;
    }
  });

  // Analyze links
  const links = document.querySelectorAll('a[href]');
  data.links.total = links.length;
  const currentDomain = window.location.hostname;
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    try {
      const url = new URL(href, window.location.href);
      if (url.hostname === currentDomain) {
        data.links.internal++;
      } else {
        data.links.external++;
      }
    } catch (e) {
      // Invalid URL
    }

    if (link.getAttribute('rel') === 'nofollow') {
      data.links.nofollow++;
    }
  });

  // Get Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) data.openGraph.title = ogTitle.getAttribute('content') || '';

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) data.openGraph.description = ogDesc.getAttribute('content') || '';

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) data.openGraph.image = ogImage.getAttribute('content') || '';

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) data.openGraph.url = ogUrl.getAttribute('content') || '';

  return data;
}

// Function to extract Google SERP data
function extractGoogleSERPData() {
  const data = {
    query: '',
    totalResults: 0,
    results: []
  };

  // Get search query
  const searchInput = document.querySelector('input[name="q"]');
  if (searchInput) {
    data.query = searchInput.value || '';
  }

  // Get total results count
  const resultStats = document.getElementById('result-stats');
  if (resultStats) {
    const match = resultStats.textContent.match(/[\d,]+/);
    if (match) {
      data.totalResults = match[0];
    }
  }

  // Extract organic search results
  const searchResults = document.querySelectorAll('div.g, div[data-sokoban-container]');
  
  searchResults.forEach((result, index) => {
    if (index >= 10) return; // Limit to top 10
    
    const titleElement = result.querySelector('h3');
    const linkElement = result.querySelector('a');
    const snippetElement = result.querySelector('div[data-sncf], div.VwiC3b, span.aCOpRe');
    
    if (titleElement || linkElement) {
      data.results.push({
        title: titleElement ? titleElement.textContent : '',
        url: linkElement ? linkElement.href : '',
        snippet: snippetElement ? snippetElement.textContent : ''
      });
    }
  });

  return data;
}
