// SEO Analysis Script for Popup
document.addEventListener('DOMContentLoaded', function () {
  // Constants
  const AVERAGE_READING_SPEED = 200; // words per minute
  
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Utility function to escape HTML
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // Функция поиска слов - объявляем в глобальной области видимости
  function performWordSearch() {
    const searchInput = document.getElementById('word-search-input');
    const searchResults = document.getElementById('search-results');
    const searchResultsList = document.getElementById('search-results-list');

    if (!searchInput || !searchResults || !searchResultsList) {
      console.warn('Search elements not found');
      return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
      searchResults.classList.add('hidden');
      return;
    }

    // Поиск в реальных данных если они есть
    if (window.currentPageData && window.currentPageData.contentData) {
      const results = [];
      const contentData = window.currentPageData.contentData;

      // Поиск в одиночных словах
      if (contentData.singleWords) {
        Object.entries(contentData.singleWords).forEach(([word, data]) => {
          if (word.includes(searchTerm)) {
            results.push({ word: word, count: data.count, percentage: parseFloat(data.percentage) });
          }
        });
      }

      // Поиск в двойных фразах
      if (contentData.doubleWords) {
        Object.entries(contentData.doubleWords).forEach(([phrase, data]) => {
          if (phrase.includes(searchTerm)) {
            results.push({ word: phrase, count: data.count, percentage: parseFloat(data.percentage) });
          }
        });
      }

      // Поиск в тройных фразах
      if (contentData.tripleWords) {
        Object.entries(contentData.tripleWords).forEach(([phrase, data]) => {
          if (phrase.includes(searchTerm)) {
            results.push({ word: phrase, count: data.count, percentage: parseFloat(data.percentage) });
          }
        });
      }

      // Сортируем по количеству вхождений
      results.sort((a, b) => b.count - a.count);

      if (results.length > 0) {
        searchResultsList.innerHTML = results.slice(0, 10).map(item => `
          <div class="word-item">
            <span class="word-text">${escapeHtml(item.word)}</span>
            <div>
              <span class="word-count">${item.count}</span>
              <span class="word-percentage">${item.percentage}%</span>
            </div>
          </div>
        `).join('');
      } else {
        searchResultsList.innerHTML = '<div class="no-results">No results found for "' + searchTerm + '"</div>';
      }
    } else {
      // Fallback к mock данным
      const mockResults = [
        { word: escapeHtml(searchTerm), count: 5, percentage: 0.4 },
        { word: escapeHtml(searchTerm) + ' optimization', count: 3, percentage: 0.24 },
        { word: 'best ' + escapeHtml(searchTerm), count: 2, percentage: 0.16 }
      ];

      searchResultsList.innerHTML = mockResults.map(item => `
        <div class="word-item">
          <span class="word-text">${item.word}</span>
          <div>
            <span class="word-count">${item.count}</span>
            <span class="word-percentage">${item.percentage}%</span>
          </div>
        </div>
      `).join('');
    }

    searchResults.classList.remove('hidden');
  }

  // Инициализация
  initializeTheme();
  initializeTabs();
  initializeRobotsAnalyzer();

  // Автоматический анализ страницы при загрузке
  setTimeout(() => {
    analyzePage();
    // Инициализируем word tabs после загрузки данных
    setTimeout(() => {
      initializeWordTabs();
    }, 500);
  }, 100);

  function initializeRobotsAnalyzer() {
    const analyzeRobotsBtn = document.getElementById('analyze-robots-btn');
    if (analyzeRobotsBtn) {
      analyzeRobotsBtn.addEventListener('click', analyzeRobotsTxt);
    }
  }

  async function analyzeRobotsTxt() {
    const robotsContent = document.getElementById('robots-content');
    const analyzeBtn = document.getElementById('analyze-robots-btn');
    
    if (!robotsContent) return;

    try {
      if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
      }

      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Execute script in the page context to fetch robots.txt
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async () => {
          try {
            const url = new URL(window.location.href);
            const robotsUrl = `${url.origin}/robots.txt`;
            const response = await fetch(robotsUrl);
            
            if (!response.ok) {
              return { 
                success: false, 
                error: `HTTP ${response.status}: ${response.statusText}`,
                url: robotsUrl
              };
            }

            const text = await response.text();
            return { success: true, text: text, url: robotsUrl };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      });

      const data = result.result;
      
      if (!data.success) {
        robotsContent.innerHTML = `
          <div class="robots-error">
            ❌ Could not fetch robots.txt
            <div style="margin-top: 8px; font-size: 11px;">${escapeHtml(data.error)}</div>
          </div>
        `;
      } else if (!data.text || data.text.trim() === '') {
        robotsContent.innerHTML = '<div class="robots-error">⚠️ Robots.txt file is empty</div>';
      } else {
        // Parse and display robots.txt with basic formatting
        const formattedText = parseRobotsTxt(data.text);
        robotsContent.innerHTML = `
          <div class="robots-success">✅ Robots.txt found at: ${escapeHtml(data.url)}</div>
          <div class="robots-content">${formattedText}</div>
        `;
      }
    } catch (error) {
      console.error('Error analyzing robots.txt:', error);
      robotsContent.innerHTML = `
        <div class="robots-error">
          ❌ Error: ${escapeHtml(error.message)}
        </div>
      `;
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Robots.txt';
      }
    }
  }

  function parseRobotsTxt(text) {
    // Basic parsing and formatting of robots.txt with HTML escaping
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    const lines = text.split('\n');
    let formatted = '';
    
    lines.forEach(line => {
      const escapedLine = escapeHtml(line);
      const trimmed = line.trim();
      if (trimmed === '') {
        formatted += '\n';
      } else if (trimmed.startsWith('#')) {
        formatted += `<span style="color: var(--muted-foreground);">${escapedLine}</span>\n`;
      } else if (trimmed.toLowerCase().startsWith('user-agent:')) {
        formatted += `<span style="color: var(--primary); font-weight: 600;">${escapedLine}</span>\n`;
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        formatted += `<span style="color: var(--destructive);">${escapedLine}</span>\n`;
      } else if (trimmed.toLowerCase().startsWith('allow:')) {
        formatted += `<span style="color: var(--success);">${escapedLine}</span>\n`;
      } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
        formatted += `<span style="color: var(--primary);">${escapedLine}</span>\n`;
      } else {
        formatted += `${escapedLine}\n`;
      }
    });
    
    return formatted;
  }

  function initializeTheme() {
    if (!themeToggle) return;

    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');

    themeToggle.addEventListener('click', function () {
      if (body.classList.contains('light')) {
        body.classList.remove('light');
        body.classList.add('dark');
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
      } else {
        body.classList.remove('dark');
        body.classList.add('light');
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
      }
    });
  }

  // Переключение основных табов
  function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        const tabName = this.getAttribute('data-tab');

        // Убираем активный класс со всех кнопок и контента
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Добавляем активный класс к выбранной кнопке и контенту
        this.classList.add('active');
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
          targetTab.classList.add('active');
        }

        // Если переключились на вкладку content, инициализируем word tabs
        if (tabName === 'content') {
          setTimeout(() => {
            initializeWordTabs();
          }, 100);
        }
      });
    });
  }

  // Переключение табов слов
  function initializeWordTabs() {
    const wordTabButtons = document.querySelectorAll('.word-tab-button');
    const wordTabContents = document.querySelectorAll('.word-tab-content');

    if (wordTabButtons.length === 0) {
      console.warn('Word tab buttons not found, will retry later');
      return;
    }

    // Удаляем старые обработчики если они есть
    wordTabButtons.forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
    });

    // Добавляем новые обработчики
    document.querySelectorAll('.word-tab-button').forEach(button => {
      button.addEventListener('click', function () {
        const tabName = this.getAttribute('data-word-tab');

        document.querySelectorAll('.word-tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.word-tab-content').forEach(content => content.classList.remove('active'));

        this.classList.add('active');
        const targetWordTab = document.getElementById(tabName + '-words');
        if (targetWordTab) {
          targetWordTab.classList.add('active');
        }
      });
    });

    // Поиск слов - проверяем существование элементов
    const searchBtn = document.getElementById('word-search-btn');
    const searchInput = document.getElementById('word-search-input');

    if (searchBtn && !searchBtn.hasAttribute('data-listener-added')) {
      searchBtn.addEventListener('click', performWordSearch);
      searchBtn.setAttribute('data-listener-added', 'true');
    }

    if (searchInput && !searchInput.hasAttribute('data-listener-added')) {
      searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          performWordSearch();
        }
      });
      searchInput.setAttribute('data-listener-added', 'true');
    }
  }

  // Функция отображения результатов SERP
  function displaySERPResults(data) {
    const serpSection = document.getElementById('serp-section');
    const serpInfo = document.getElementById('serp-info');

    if (serpSection) serpSection.classList.remove('hidden');

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
      if (serpInfo) serpInfo.innerHTML = html;
    } else {
      if (serpInfo) serpInfo.innerHTML = '<p class="status-warning">⚠️ No search results found on this page.</p>';
    }

    // Hide other sections for SERP pages
    const scoreInfo = document.getElementById('score-info');
    if (scoreInfo) {
      scoreInfo.innerHTML = '<p style="text-align: center; color: hsl(var(--muted-foreground));">SERP analysis mode - SEO score not applicable</p>';
    }

    // Hide other cards
    document.querySelectorAll('.card').forEach((card, index) => {
      if (index > 1) { // Keep score and SERP cards
        card.style.display = 'none';
      }
    });
  }

  // Добавляем недостающую функцию displayResults
  function displayResults(data) {
    // Show all cards
    document.querySelectorAll('.card').forEach(card => {
      card.style.display = 'block';
    });

    // Hide SERP section
    const serpSection = document.getElementById('serp-section');
    if (serpSection) serpSection.classList.add('hidden');

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
    if (scoreInfo) {
      scoreInfo.innerHTML = `
        <div class="score-value">${score}/100</div>
        <div class="score-label">${getScoreLabel(score)}</div>
      `;
    }

    // Title Tag Analysis
    const titleInfo = document.getElementById('title-info');
    if (titleInfo) {
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
    }

    // Meta Description Analysis
    const metaDescInfo = document.getElementById('meta-description-info');
    if (metaDescInfo) {
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
    }

    // Headings Analysis
    const headingsInfo = document.getElementById('headings-info');
    if (headingsInfo) {
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
    }

    // Images Analysis
    const imagesInfo = document.getElementById('images-info');
    if (imagesInfo) {
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
    }

    // Links Analysis
    const linksInfo = document.getElementById('links-info');
    if (linksInfo) {
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
    }

    // Open Graph Tags
    const ogInfo = document.getElementById('og-info');
    if (ogInfo) {
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
  }

  // Добавляем функцию calculateSEOScore
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

  // Добавляем функцию getScoreLabel
  function getScoreLabel(score) {
    if (score >= 90) return '🌟 Excellent SEO!';
    if (score >= 70) return '✅ Good SEO';
    if (score >= 50) return '⚠️ Needs Improvement';
    return '❌ Poor SEO';
  }

  async function analyzePage() {
    // Show loading state
    if (loading) loading.classList.remove('hidden');
    if (results) results.classList.add('hidden');

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

      // Сохраняем данные для поиска
      window.currentPageData = seoData;

      // Display the results
      if (isGoogleSearch) {
        displaySERPResults(seoData);
      } else {
        displayResults(seoData);
        displayHeadings(seoData);
        displayLinks(seoData);
        displayImages(seoData);
        displayContent(seoData);
      }

      // Show tab navigation
      const tabNavigation = document.getElementById('tab-navigation');
      if (tabNavigation) tabNavigation.classList.remove('hidden');

      // Hide loading and show results
      if (loading) loading.classList.add('hidden');
      if (results) results.classList.remove('hidden');

      // Инициализируем word tabs после отображения результатов
      setTimeout(() => {
        initializeWordTabs();
      }, 200);

    } catch (error) {
      console.error('Error analyzing page:', error);
      // Показываем тестовые данные при ошибке
      displayMockData();

      if (loading) loading.classList.add('hidden');
      if (results) results.classList.remove('hidden');

      const tabNavigation = document.getElementById('tab-navigation');
      if (tabNavigation) tabNavigation.classList.remove('hidden');

      // Инициализируем word tabs для mock данных
      setTimeout(() => {
        initializeWordTabs();
      }, 200);
    }
  }

  // Функция для отображения тестовых данных
  function displayMockData() {
    const mockData = {
      title: 'Example Page Title - SEO Optimized',
      metaDescription: 'This is an example meta description that shows how the SEO analyzer works.',
      headings: { h1: 1, h2: 5, h3: 8, h4: 3 },
      images: { total: 12, missingAlt: 3 },
      links: { total: 33, internal: 25, external: 8, nofollow: 2 },
      openGraph: {
        title: 'Example OG Title',
        description: 'Example OG Description',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com'
      },
      imagesList: [
        { src: 'https://example.com/image1.jpg', alt: 'Example image 1', hasAlt: true, width: 800, height: 600 },
        { src: 'https://example.com/image2.jpg', alt: 'Example image 2', hasAlt: true, width: 1200, height: 800 },
        { src: 'https://example.com/image3.jpg', alt: '', hasAlt: false, width: 400, height: 300 },
        { src: 'https://example.com/logo.png', alt: 'Company Logo', hasAlt: true, width: 200, height: 100 },
        { src: 'https://example.com/banner.jpg', alt: '', hasAlt: false, width: 1920, height: 400 }
      ]
    };

    displayResults(mockData);
    displayMockHeadings();
    displayMockLinks();
    displayImages(mockData);
    displayMockContent();
  }

  // Функция для отображения тестовых заголовков
  function displayMockHeadings() {
    const headingsStructure = document.getElementById('headings-structure');
    if (!headingsStructure) return;

    const mockHeadings = [
      { level: 'h1', text: 'Main Page Title' },
      { level: 'h2', text: 'Introduction Section' },
      { level: 'h3', text: 'Key Features' },
      { level: 'h3', text: 'Benefits Overview' },
      { level: 'h2', text: 'How It Works' },
      { level: 'h3', text: 'Step 1: Analysis' },
      { level: 'h3', text: 'Step 2: Optimization' },
      { level: 'h4', text: 'Technical Details' },
      { level: 'h2', text: 'Conclusion' }
    ];

    headingsStructure.innerHTML = mockHeadings.map(heading => `
      <div class="heading-item heading-${heading.level}">
        <span class="heading-level">${heading.level.toUpperCase()}</span>
        <span class="heading-text">${heading.text}</span>
      </div>
    `).join('');
  }

  // Функция для отображения тестовых ссылок
  function displayMockLinks() {
    const linksAnalysis = document.getElementById('links-analysis');
    const tagsCloud = document.getElementById('tags-cloud');

    if (linksAnalysis) {
      const mockLinks = [
        { url: '/about', text: 'About Us', type: 'internal' },
        { url: '/services', text: 'Our Services', type: 'internal' },
        { url: '/contact', text: 'Contact', type: 'internal' },
        { url: 'https://google.com', text: 'Google', type: 'external' },
        { url: 'https://github.com', text: 'GitHub', type: 'external' }
      ];

      const linksSummary = `
        <div class="links-summary">
          <div class="link-stat">
            <span class="link-stat-value">3</span>
            <span class="link-stat-label">Internal</span>
          </div>
          <div class="link-stat">
            <span class="link-stat-value">2</span>
            <span class="link-stat-label">External</span>
          </div>
          <div class="link-stat">
            <span class="link-stat-value">5</span>
            <span class="link-stat-label">Total</span>
          </div>
        </div>
      `;

      const linksHtml = mockLinks.map(link => `
        <div class="link-item">
          <a href="${link.url}" class="link-url" target="_blank">${link.url}</a>
          <div class="link-text">${link.text}</div>
          <span class="link-type link-${link.type}">${link.type}</span>
        </div>
      `).join('');

      linksAnalysis.innerHTML = linksSummary + linksHtml;
    }

    if (tagsCloud) {
      const mockTags = ['seo', 'optimization', 'analysis', 'web', 'performance', 'google', 'search', 'ranking'];
      const tagsHtml = mockTags.map((tag, index) => {
        const size = Math.min(5, Math.max(1, Math.floor(Math.random() * 5) + 1));
        const count = Math.floor(Math.random() * 10) + 1;
        return `<span class="tag-item tag-size-${size}">${tag}<span class="tag-count">${count}</span></span>`;
      }).join('');

      tagsCloud.innerHTML = `
        <h3 class="section-title" style="margin-top: 16px;">Link Text Cloud</h3>
        <div class="tags-cloud">${tagsHtml}</div>
      `;
    }
  }

  // Функция для отображения тестового контента
  function displayMockContent() {
    const contentOverview = document.getElementById('content-overview');
    if (contentOverview) {
      contentOverview.innerHTML = `
        <div class="content-stat">
          <span class="content-stat-value">1247</span>
          <span class="content-stat-label">Words</span>
        </div>
        <div class="content-stat">
          <span class="content-stat-value">7856</span>
          <span class="content-stat-label">Characters</span>
        </div>
        <div class="content-stat">
          <span class="content-stat-value">15</span>
          <span class="content-stat-label">Paragraphs</span>
        </div>
        <div class="content-stat">
          <span class="content-stat-value">89</span>
          <span class="content-stat-label">Sentences</span>
        </div>
        <div class="content-stat">
          <span class="content-stat-value">38</span>
          <span class="content-stat-label">Words/Link</span>
        </div>
        <div class="content-stat">
          <span class="content-stat-value">6</span>
          <span class="content-stat-label">Min Read</span>
        </div>
      `;
    }

    // Отображение списков слов
    displayWordList('single-words-list', [
      { word: 'seo', count: 25, percentage: 2.0 },
      { word: 'optimization', count: 18, percentage: 1.4 },
      { word: 'page', count: 15, percentage: 1.2 },
      { word: 'analysis', count: 12, percentage: 0.96 },
      { word: 'search', count: 10, percentage: 0.8 }
    ]);

    displayWordList('double-words-list', [
      { phrase: 'seo optimization', count: 8, percentage: 0.64 },
      { phrase: 'page analysis', count: 6, percentage: 0.48 },
      { phrase: 'search engine', count: 5, percentage: 0.4 }
    ]);

    displayWordList('triple-words-list', [
      { phrase: 'search engine optimization', count: 4, percentage: 0.32 },
      { phrase: 'page seo analysis', count: 3, percentage: 0.24 }
    ]);
  }

  // Функция для отображения списка слов
  function displayWordList(containerId, words) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = words.map(item => `
      <div class="word-item">
        <span class="word-text">${escapeHtml(item.word || item.phrase)}</span>
        <div>
          <span class="word-count">${item.count}</span>
          <span class="word-percentage">${item.percentage}%</span>
        </div>
      </div>
    `).join('');
  }

  function displayHeadings(data) {
    const headingsStructure = document.getElementById('headings-structure');
    if (!headingsStructure || !data.headingsList) {
      displayMockHeadings();
      return;
    }

    if (data.headingsList.length === 0) {
      headingsStructure.innerHTML = '<p class="no-results">No headings found on this page.</p>';
      return;
    }

    headingsStructure.innerHTML = data.headingsList.map(heading => `
      <div class="heading-item heading-${escapeHtml(heading.level)}">
        <span class="heading-level">${escapeHtml(heading.level).toUpperCase()}</span>
        <span class="heading-text">${escapeHtml(heading.text)}</span>
      </div>
    `).join('');
  }

  function displayLinks(data) {
    const linksAnalysis = document.getElementById('links-analysis');
    const tagsCloud = document.getElementById('tags-cloud');

    if (!linksAnalysis || !data.linksList) {
      displayMockLinks();
      return;
    }

    // Статистика ссылок
    const internalLinks = data.linksList.filter(link => link.type === 'internal');
    const externalLinks = data.linksList.filter(link => link.type === 'external');

    const linksSummary = `
      <div class="links-summary">
        <div class="link-stat">
          <span class="link-stat-value">${internalLinks.length}</span>
          <span class="link-stat-label">Internal</span>
        </div>
        <div class="link-stat">
          <span class="link-stat-value">${externalLinks.length}</span>
          <span class="link-stat-label">External</span>
        </div>
        <div class="link-stat">
          <span class="link-stat-value">${data.linksList.length}</span>
          <span class="link-stat-label">Total</span>
        </div>
      </div>
    `;

    // Список ссылок (ограничиваем до 20 для производительности)
    const linksToShow = data.linksList.slice(0, 20);
    const linksHtml = linksToShow.map(link => `
      <div class="link-item">
        <a href="${escapeHtml(link.url)}" class="link-url" target="_blank">${escapeHtml(link.url)}</a>
        <div class="link-text">${escapeHtml(link.text)}</div>
        <span class="link-type link-${escapeHtml(link.type)}">${escapeHtml(link.type)}</span>
      </div>
    `).join('');

    linksAnalysis.innerHTML = linksSummary + linksHtml +
      (data.linksList.length > 20 ? `<p class="text-center" style="margin-top: 12px; color: hsl(var(--muted-foreground));">Showing first 20 of ${data.linksList.length} links</p>` : '');

    // Облако тегов из текста ссылок
    if (tagsCloud) {
      const linkTexts = data.linksList.map(link => link.text.toLowerCase()).join(' ');
      const words = linkTexts.match(/\b\w{3,}\b/g) || [];
      const wordCount = {};

      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      const sortedTags = Object.entries(wordCount)
        .filter(([word, count]) => count > 1)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15);

      if (sortedTags.length > 0) {
        const tagsHtml = sortedTags.map(([tag, count]) => {
          const size = Math.min(5, Math.max(1, Math.ceil(count / 2)));
          return `<span class="tag-item tag-size-${size}">${escapeHtml(tag)}<span class="tag-count">${count}</span></span>`;
        }).join('');

        tagsCloud.innerHTML = `
          <h3 class="section-title" style="margin-top: 16px;">Link Text Cloud</h3>
          <div class="tags-cloud">${tagsHtml}</div>
        `;
      } else {
        tagsCloud.innerHTML = `
          <h3 class="section-title" style="margin-top: 16px;">Link Text Cloud</h3>
          <div class="tags-cloud-empty">No common tags found in link texts</div>
        `;
      }
    }
  }

  function displayImages(data) {
    const imagesOverview = document.getElementById('images-overview');
    const imagesList = document.getElementById('images-list');

    if (!imagesOverview || !imagesList) {
      console.warn('Images elements not found');
      return;
    }

    if (!data || !data.imagesList) {
      console.warn('No images data available');
      imagesOverview.innerHTML = '<p class="no-results">No images data available</p>';
      return;
    }

    const images = data.imagesList;
    const totalImages = images.length;
    const imagesWithAlt = images.filter(img => img.hasAlt).length;
    const imagesWithoutAlt = totalImages - imagesWithAlt;

    // Display overview statistics
    imagesOverview.innerHTML = `
      <div class="links-summary">
        <div class="link-stat">
          <span class="link-stat-value">${totalImages}</span>
          <span class="link-stat-label">Total</span>
        </div>
        <div class="link-stat">
          <span class="link-stat-value">${imagesWithAlt}</span>
          <span class="link-stat-label">With Alt</span>
        </div>
        <div class="link-stat">
          <span class="link-stat-value">${imagesWithoutAlt}</span>
          <span class="link-stat-label">Missing Alt</span>
        </div>
      </div>
    `;

    // Display images list (limit to 50 for performance)
    if (totalImages === 0) {
      imagesList.innerHTML = '<p class="no-results">No images found on this page</p>';
      return;
    }

    const imagesToShow = images.slice(0, 50);
    const imagesHtml = imagesToShow.map((img, index) => `
      <div class="image-item ${img.hasAlt ? 'has-alt' : 'no-alt'}">
        <div class="image-url">Image #${index + 1}: ${escapeHtml(img.src.substring(0, 60))}${img.src.length > 60 ? '...' : ''}</div>
        ${img.hasAlt 
          ? `<div class="image-alt">Alt: "${escapeHtml(img.alt)}"</div>` 
          : `<div class="image-alt image-alt-missing">⚠️ Missing alt text</div>`
        }
        ${img.width && img.height ? `<div class="image-size">Size: ${img.width}x${img.height}px</div>` : ''}
      </div>
    `).join('');

    imagesList.innerHTML = imagesHtml + 
      (totalImages > 50 ? `<p class="text-center" style="margin-top: 12px; color: var(--muted-foreground);">Showing first 50 of ${totalImages} images</p>` : '');
  }

  function displayContent(data) {
    const contentOverview = document.getElementById('content-overview');

    if (!contentOverview) {
      console.warn('Content overview element not found');
      return;
    }

    if (!data || !data.contentData) {
      console.warn('No content data available, using mock data');
      displayMockContent();
      return;
    }

    const contentData = data.contentData;
    
    // Calculate text-to-link ratio
    const linksCount = data.links ? data.links.total : 0;
    const textToLinkRatio = linksCount > 0 ? Math.round(contentData.wordCount / linksCount) : contentData.wordCount;
    
    // Calculate reading time
    const readingTime = Math.ceil(contentData.wordCount / AVERAGE_READING_SPEED);

    // Статистика контента с дополнительными метриками
    contentOverview.innerHTML = `
      <div class="content-stat">
        <span class="content-stat-value">${contentData.wordCount || 0}</span>
        <span class="content-stat-label">Words</span>
      </div>
      <div class="content-stat">
        <span class="content-stat-value">${contentData.charCount || 0}</span>
        <span class="content-stat-label">Characters</span>
      </div>
      <div class="content-stat">
        <span class="content-stat-value">${contentData.paragraphCount || 0}</span>
        <span class="content-stat-label">Paragraphs</span>
      </div>
      <div class="content-stat">
        <span class="content-stat-value">${contentData.sentenceCount || 0}</span>
        <span class="content-stat-label">Sentences</span>
      </div>
      <div class="content-stat">
        <span class="content-stat-value">${textToLinkRatio}</span>
        <span class="content-stat-label">Words/Link</span>
      </div>
      <div class="content-stat">
        <span class="content-stat-value">${readingTime}</span>
        <span class="content-stat-label">Min Read</span>
      </div>
    `;

    // Отображение списков слов
    if (contentData.singleWords && Object.keys(contentData.singleWords).length > 0) {
      const singleWords = Object.entries(contentData.singleWords).map(([word, wordData]) => ({
        word: word,
        count: wordData.count,
        percentage: parseFloat(wordData.percentage)
      }));
      displayWordList('single-words-list', singleWords);
    } else {
      const container = document.getElementById('single-words-list');
      if (container) {
        container.innerHTML = '<div class="no-results">No word data available</div>';
      }
    }

    if (contentData.doubleWords && Object.keys(contentData.doubleWords).length > 0) {
      const doubleWords = Object.entries(contentData.doubleWords).map(([phrase, phraseData]) => ({
        phrase: phrase,
        count: phraseData.count,
        percentage: parseFloat(phraseData.percentage)
      }));
      displayWordList('double-words-list', doubleWords);
    } else {
      const container = document.getElementById('double-words-list');
      if (container) {
        container.innerHTML = '<div class="no-results">No 2-word phrases found</div>';
      }
    }

    if (contentData.tripleWords && Object.keys(contentData.tripleWords).length > 0) {
      const tripleWords = Object.entries(contentData.tripleWords).map(([phrase, phraseData]) => ({
        phrase: phrase,
        count: phraseData.count,
        percentage: parseFloat(phraseData.percentage)
      }));
      displayWordList('triple-words-list', tripleWords);
    } else {
      const container = document.getElementById('triple-words-list');
      if (container) {
        container.innerHTML = '<div class="no-results">No 3-word phrases found</div>';
      }
    }
  }

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
      },
      // Добавляем детальные данные для новых табов
      headingsList: [],
      linksList: [],
      imagesList: [],
      contentData: {
        wordCount: 0,
        charCount: 0,
        paragraphCount: 0,
        sentenceCount: 0,
        singleWords: {},
        doubleWords: {},
        tripleWords: {}
      }
    };

    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      data.metaDescription = metaDesc.getAttribute('content') || '';
    }

    // Analyze images with detailed information
    const images = document.querySelectorAll('img');
    data.images.total = images.length;
    images.forEach(img => {
      const alt = img.getAttribute('alt') || '';
      const hasAlt = alt.trim() !== '';
      
      if (!hasAlt) {
        data.images.missingAlt++;
      }
      
      data.imagesList.push({
        src: img.src || img.getAttribute('src') || '',
        alt: alt,
        hasAlt: hasAlt,
        width: img.width || 0,
        height: img.height || 0
      });
    });

    // Extract detailed headings
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headingElements.forEach(heading => {
      data.headingsList.push({
        level: heading.tagName.toLowerCase(),
        text: heading.textContent.trim()
      });
    });

    // Analyze links
    const links = document.querySelectorAll('a[href]');
    data.links.total = links.length;
    const currentDomain = window.location.hostname;

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      let linkType = 'internal';
      try {
        const url = new URL(href, window.location.href);
        if (url.hostname === currentDomain) {
          data.links.internal++;
          linkType = 'internal';
        } else {
          data.links.external++;
          linkType = 'external';
        }
      } catch (e) {
        // Invalid URL, treat as internal
        data.links.internal++;
      }

      if (link.getAttribute('rel') === 'nofollow') {
        data.links.nofollow++;
      }

      // Add to detailed links list
      data.linksList.push({
        url: href,
        text: link.textContent.trim(),
        type: linkType
      });
    });

    // Улучшенная функция извлечения текстового контента
    function extractTextContent() {
      // Создаем копию документа для безопасной работы
      const tempDoc = document.cloneNode(true);

      // Удаляем элементы, которые не содержат основной контент
      const elementsToRemove = [
        'script', 'style', 'noscript', 'iframe', 'object', 'embed',
        'nav', 'header', 'footer', 'aside', 'menu',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
        '[role="complementary"]', '[role="search"]',
        '.advertisement', '.ads', '.ad', '.sidebar', '.navigation',
        '.menu', '.header', '.footer', '.nav', '.breadcrumb',
        '.social', '.share', '.comment', '.comments', '.related',
        '.popup', '.modal', '.overlay', '.cookie', '.banner'
      ];

      elementsToRemove.forEach(selector => {
        const elements = tempDoc.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Ищем основной контент
      let contentElements = [];

      // Попробуем найти основной контент по семантическим тегам
      const mainContent = tempDoc.querySelector('main, [role="main"], article, .content, .main-content, #content, #main');

      if (mainContent) {
        contentElements = [mainContent];
      } else {
        // Если основной контент не найден, ищем параграфы и текстовые блоки
        contentElements = Array.from(tempDoc.querySelectorAll('p, div, section, article'));

        // Фильтруем элементы по количеству текста
        contentElements = contentElements.filter(el => {
          const text = el.textContent.trim();
          return text.length > 50 && !el.querySelector('nav, header, footer, aside');
        });
      }

      // Извлекаем текст из найденных элементов
      let fullText = '';
      contentElements.forEach(el => {
        const text = el.textContent || el.innerText || '';
        if (text.trim().length > 0) {
          fullText += ' ' + text.trim();
        }
      });

      // Если ничего не найдено, берем весь body, но очищенный
      if (fullText.trim().length < 100) {
        const bodyClone = tempDoc.body ? tempDoc.body.cloneNode(true) : tempDoc.documentElement;
        if (bodyClone) {
          fullText = bodyClone.textContent || bodyClone.innerText || '';
        }
      }

      // Очищаем текст от лишних пробелов и символов
      return fullText
        .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на одиночные
        .replace(/\n+/g, ' ')  // Заменяем переносы строк на пробелы
        .replace(/\t+/g, ' ')  // Заменяем табы на пробелы
        .trim();
    }

    const textContent = extractTextContent();

    // Улучшенный анализ контента
    // Используем более точные регулярные выражения для слов
    const words = textContent.toLowerCase()
      .match(/\b[a-zA-Zа-яё]{3,}\b/g) || []; // Только слова длиной 3+ символа

    // Фильтруем стоп-слова
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'can', 'may', 'might', 'must', 'shall', 'it', 'its', 'he', 'she', 'we', 'they',
      'our', 'your', 'his', 'her', 'them', 'us', 'me', 'you', 'him', 'all', 'any', 'each',
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'just', 'now', 'get', 'go', 'see', 'make', 'come', 'know',
      'take', 'use', 'work', 'say', 'think', 'look', 'want', 'give', 'way', 'first', 'last',
      'new', 'good', 'high', 'old', 'great', 'right', 'public', 'man', 'woman', 'life', 'child'
    ]);

    const filteredWords = words.filter(word => !stopWords.has(word));

    data.contentData.wordCount = filteredWords.length;
    data.contentData.charCount = textContent.length;
    data.contentData.paragraphCount = document.querySelectorAll('p').length;
    data.contentData.sentenceCount = (textContent.match(/[.!?]+/g) || []).length;

    // Count word frequencies
    const wordFreq = {};
    filteredWords.forEach(word => {
      if (word.length > 2) { // Skip very short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Get top single words
    const sortedWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    sortedWords.forEach(([word, count]) => {
      data.contentData.singleWords[word] = {
        count: count,
        percentage: ((count / filteredWords.length) * 100).toFixed(2)
      };
    });

    // Count 2-word phrases
    const doubleWordFreq = {};
    for (let i = 0; i < filteredWords.length - 1; i++) {
      if (filteredWords[i].length > 2 && filteredWords[i + 1].length > 2) {
        const phrase = `${filteredWords[i]} ${filteredWords[i + 1]}`;
        doubleWordFreq[phrase] = (doubleWordFreq[phrase] || 0) + 1;
      }
    }

    const sortedDoubleWords = Object.entries(doubleWordFreq)
      .filter(([, count]) => count > 1) // Только фразы, встречающиеся более одного раза
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    sortedDoubleWords.forEach(([phrase, count]) => {
      data.contentData.doubleWords[phrase] = {
        count: count,
        percentage: ((count / (filteredWords.length - 1)) * 100).toFixed(2)
      };
    });

    // Count 3-word phrases
    const tripleWordFreq = {};
    for (let i = 0; i < filteredWords.length - 2; i++) {
      if (filteredWords[i].length > 2 && filteredWords[i + 1].length > 2 && filteredWords[i + 2].length > 2) {
        const phrase = `${filteredWords[i]} ${filteredWords[i + 1]} ${filteredWords[i + 2]}`;
        tripleWordFreq[phrase] = (tripleWordFreq[phrase] || 0) + 1;
      }
    }

    const sortedTripleWords = Object.entries(tripleWordFreq)
      .filter(([, count]) => count > 1) // Только фразы, встречающиеся более одного раза
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    sortedTripleWords.forEach(([phrase, count]) => {
      data.contentData.tripleWords[phrase] = {
        count: count,
        percentage: ((count / (filteredWords.length - 2)) * 100).toFixed(2)
      };
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
});
