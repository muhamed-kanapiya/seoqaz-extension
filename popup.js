// SEO Analysis Script for Popup
document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyze-btn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');

  analyzeBtn.addEventListener('click', analyzePage);

  async function analyzePage() {
    // Show loading state
    loading.classList.remove('hidden');
    results.classList.add('hidden');

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Execute the content script to get SEO data
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractSEOData
      });

      const seoData = result.result;

      // Display the results
      displayResults(seoData);

      // Hide loading and show results
      loading.classList.add('hidden');
      results.classList.remove('hidden');
    } catch (error) {
      console.error('Error analyzing page:', error);
      alert('Error analyzing page. Please try again.');
      loading.classList.add('hidden');
    }
  }

  function displayResults(data) {
    // Ensure data properties exist with defaults
    const title = data.title || '';
    const metaDescription = data.metaDescription || '';
    const headings = data.headings || { h1: 0, h2: 0, h3: 0, h4: 0 };
    const images = data.images || { total: 0, missingAlt: 0 };
    const links = data.links || { total: 0, internal: 0, external: 0, nofollow: 0 };
    const openGraph = data.openGraph || { title: '', description: '', image: '', url: '' };
    
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
      <strong>Title:</strong> ${title || '<em>Not found</em>'}<br>
      <strong>Length:</strong> ${titleLength} characters ${titleStatus}<br>
      <small>Recommended: 30-60 characters</small>
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
      <strong>Description:</strong> ${metaDescription || '<em>Not found</em>'}<br>
      <strong>Length:</strong> ${descLength} characters ${descStatus}<br>
      <small>Recommended: 120-160 characters</small>
    `;

    // Headings Analysis
    const headingsInfo = document.getElementById('headings-info');
    const h1Status = headings.h1 === 1 ? '<span class="status-good">✅ Good</span>' :
                     headings.h1 === 0 ? '<span class="status-error">❌ Missing</span>' :
                     '<span class="status-warning">⚠️ Multiple H1 tags</span>';
    headingsInfo.innerHTML = `
      <strong>H1:</strong> ${headings.h1} ${h1Status}<br>
      <strong>H2:</strong> ${headings.h2}<br>
      <strong>H3:</strong> ${headings.h3}<br>
      <strong>H4:</strong> ${headings.h4}<br>
      <small>Best practice: Use exactly one H1 tag per page</small>
    `;

    // Images Analysis
    const imagesInfo = document.getElementById('images-info');
    const missingAltPercent = images.total > 0 
      ? Math.round((images.missingAlt / images.total) * 100)
      : 0;
    const altStatus = images.missingAlt === 0 ? '<span class="status-good">✅ All images have alt text</span>' :
                      '<span class="status-warning">⚠️ Some images missing alt text</span>';
    imagesInfo.innerHTML = `
      <strong>Total Images:</strong> ${images.total}<br>
      <strong>Missing Alt Text:</strong> ${images.missingAlt} (${missingAltPercent}%) ${altStatus}<br>
      <small>All images should have descriptive alt text for SEO and accessibility</small>
    `;

    // Links Analysis
    const linksInfo = document.getElementById('links-info');
    linksInfo.innerHTML = `
      <strong>Total Links:</strong> ${links.total}<br>
      <strong>Internal Links:</strong> ${links.internal}<br>
      <strong>External Links:</strong> ${links.external}<br>
      <strong>Broken Links:</strong> ${links.nofollow} (nofollow)<br>
      <small>Good internal linking structure helps SEO</small>
    `;

    // Open Graph Tags
    const ogInfo = document.getElementById('og-info');
    const ogStatus = (openGraph.title && openGraph.description && openGraph.image) 
      ? '<span class="status-good">✅ Essential tags present</span>'
      : '<span class="status-warning">⚠️ Missing some tags</span>';
    ogInfo.innerHTML = `
      <strong>og:title:</strong> ${openGraph.title || '<em>Not found</em>'}<br>
      <strong>og:description:</strong> ${openGraph.description || '<em>Not found</em>'}<br>
      <strong>og:image:</strong> ${openGraph.image ? '✅ Present' : '<em>Not found</em>'}<br>
      <strong>og:url:</strong> ${openGraph.url || '<em>Not found</em>'}<br>
      ${ogStatus}
    `;

    // Calculate and display SEO Score
    const scoreInfo = document.getElementById('score-info');
    const score = calculateSEOScore(data);
    scoreInfo.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 10px;">${score}/100</div>
      <div>${getScoreLabel(score)}</div>
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
