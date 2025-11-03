// SEO Analysis Script for Popup

// Utility function to escape HTML - defined globally
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Shared stop words for content analysis
const STOP_WORDS = new Set([
  // English stop words
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'can', 'may', 'might', 'must', 'shall', 'it', 'its', 'he', 'she', 'we', 'they',
  'our', 'your', 'his', 'her', 'them', 'us', 'me', 'you', 'him', 'all', 'any', 'each',
  // Russian stop words
  'это', 'как', 'его', 'она', 'так', 'но', 'или', 'что', 'все', 'были', 'есть',
  'был', 'для', 'без', 'при', 'про', 'над', 'под', 'том', 'вам', 'вас', 'нас',
  'них', 'еще', 'уже', 'где', 'там', 'тут', 'чем', 'эти', 'эта', 'этот',
  // Kazakh stop words
  'мен', 'сен', 'ол', 'біз', 'сіз', 'олар', 'және', 'осы', 'бұл', 'сол', 'деп', 'еді',
  'үшін', 'мұнда', 'онда', 'бар', 'жоқ', 'дейін', 'кейін', 'артық', 'кем'
]);

// Reusable function to attach copy functionality to copy buttons
function attachCopyHandlers(container) {
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const text = this.getAttribute('data-text');
      navigator.clipboard.writeText(text).then(() => {
        const icon = this.querySelector('i');
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-check');
        this.classList.add('copied');
        
        setTimeout(() => {
          icon.classList.remove('fa-check');
          icon.classList.add('fa-copy');
          this.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text:', err);
        // Show error feedback
        const icon = this.querySelector('i');
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-times');
        this.style.background = 'var(--destructive)';
        
        setTimeout(() => {
          icon.classList.remove('fa-times');
          icon.classList.add('fa-copy');
          this.style.background = '';
        }, 2000);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

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
            <span class="word-text">${item.word}</span>
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
        { word: searchTerm, count: 5, percentage: 0.4 },
        { word: searchTerm + ' optimization', count: 3, percentage: 0.24 },
        { word: 'best ' + searchTerm, count: 2, percentage: 0.16 }
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

  // Автоматический анализ страницы при загрузке
  setTimeout(() => {
    analyzePage();
    // Инициализируем word tabs после загрузки данных
    setTimeout(() => {
      initializeWordTabs();
    }, 500);
  }, 100);

  function initializeTheme() {
    if (!themeToggle) return;

    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');

    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('seoqaz-theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', function () {
      const currentTheme = body.classList.contains('light') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      // Сохраняем тему в localStorage
      localStorage.setItem('seoqaz-theme', newTheme);
    });

    function setTheme(theme) {
      if (theme === 'dark') {
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
    }
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

  // Enable drag and drop functionality for an element
  function enableDragAndDrop(element) {
    console.log('[SEOQaz Debug] Enabling drag and drop for element:', element);
    
    if (!element) {
      console.warn('[SEOQaz Debug] Cannot enable drag and drop: element is null');
      return;
    }

    // Make the element draggable
    element.setAttribute('draggable', 'true');
    element.style.cursor = 'move';
    
    // Add visual indicator that element is draggable
    const cardHeader = element.querySelector('.card-header');
    if (cardHeader) {
      cardHeader.style.cursor = 'move';
      cardHeader.title = 'Drag to reorder';
      
      // Add drag icon to header
      const dragIcon = document.createElement('span');
      dragIcon.innerHTML = '<i class="fas fa-grip-vertical" style="margin-right: 8px; color: var(--muted-foreground);"></i>';
      dragIcon.style.opacity = '0.6';
      const titleElement = cardHeader.querySelector('.card-title');
      if (titleElement) {
        cardHeader.insertBefore(dragIcon, titleElement);
      }
    }

    let draggedElement = null;

    // Drag start event
    element.addEventListener('dragstart', function(e) {
      console.log('[SEOQaz Debug] Drag started');
      draggedElement = this;
      this.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    });

    // Drag end event
    element.addEventListener('dragend', function(e) {
      console.log('[SEOQaz Debug] Drag ended');
      this.style.opacity = '1';
      
      // Remove drag over styling from all cards
      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('drag-over');
      });
    });

    // Drag over event - allow drop
    element.addEventListener('dragover', function(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      
      // Add visual feedback
      if (draggedElement !== this) {
        this.classList.add('drag-over');
      }
      return false;
    });

    // Drag enter event
    element.addEventListener('dragenter', function(e) {
      if (draggedElement !== this) {
        this.classList.add('drag-over');
      }
    });

    // Drag leave event
    element.addEventListener('dragleave', function(e) {
      this.classList.remove('drag-over');
    });

    // Drop event
    element.addEventListener('drop', function(e) {
      console.log('[SEOQaz Debug] Drop event triggered');
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      // Don't do anything if dropping the same card
      if (draggedElement !== this) {
        // Swap the dragged element with this element
        const parent = this.parentNode;
        const draggedIndex = Array.from(parent.children).indexOf(draggedElement);
        const droppedIndex = Array.from(parent.children).indexOf(this);
        
        if (draggedIndex < droppedIndex) {
          parent.insertBefore(draggedElement, this.nextSibling);
        } else {
          parent.insertBefore(draggedElement, this);
        }
        
        console.log('[SEOQaz Debug] Elements reordered');
      }

      this.classList.remove('drag-over');
      return false;
    });
  }

  // Функция отображения результатов SERP
  function displaySERPResults(data) {
    console.log('[SEOQaz Debug] Displaying SERP results with data:', data);
    const serpSection = document.getElementById('serp-section');
    const serpInfo = document.getElementById('serp-info');

    if (serpSection) {
      serpSection.classList.remove('hidden');
      // Enable drag and drop for SERP section
      enableDragAndDrop(serpSection);
    }

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

    // Display Google Snippet Preview
    displayGoogleSnippetPreview(data);

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

  // Display Google SERP snippet preview
  function displayGoogleSnippetPreview(data) {
    const snippetPreview = document.getElementById('google-snippet-preview');
    if (!snippetPreview) return;

    const title = data.title || '';
    const metaDescription = data.metaDescription || '';
    const currentUrl = window.currentPageData?.url || 'https://example.com';

    // Extract domain from URL
    let domain = 'example.com';
    let breadcrumb = '';
    try {
      const urlObj = new URL(currentUrl);
      domain = urlObj.hostname.replace('www.', '');
      breadcrumb = urlObj.pathname !== '/' ? ' › ...' : '';
    } catch (e) {
      // Invalid URL, use default
    }

    // Truncate title and description as Google does
    const displayTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
    const displayDescription = metaDescription.length > 160 ? metaDescription.substring(0, 160) + '...' : metaDescription;

    // Check for warnings
    let warnings = [];
    if (title.length === 0) {
      warnings.push('⚠️ Missing title - Google will generate one automatically');
    } else if (title.length > 60) {
      warnings.push('⚠️ Title is too long and will be truncated in search results');
    } else if (title.length < 30) {
      warnings.push('⚠️ Title is too short - consider making it more descriptive');
    }

    if (metaDescription.length === 0) {
      warnings.push('⚠️ Missing meta description - Google will generate one from page content');
    } else if (metaDescription.length > 160) {
      warnings.push('⚠️ Description is too long and will be truncated in search results');
    } else if (metaDescription.length < 120) {
      warnings.push('⚠️ Description is too short - you have more space to describe your page');
    }

    snippetPreview.innerHTML = `
      <div class="snippet-url">
        <span class="snippet-domain">${escapeHtml(domain)}</span>
        <span class="snippet-breadcrumb">${escapeHtml(breadcrumb)}</span>
      </div>
      <div class="snippet-title">${escapeHtml(displayTitle || 'Your Page Title')}</div>
      <div class="snippet-description">${escapeHtml(displayDescription || 'Your meta description will appear here...')}</div>
      ${warnings.length > 0 ? warnings.map(w => `<div class="snippet-warning">${w}</div>`).join('') : ''}
    `;
  }

  async function analyzePage() {
    console.log('[SEOQaz Debug] Starting page analysis...');
    // Show loading state
    if (loading) loading.classList.remove('hidden');
    if (results) results.classList.add('hidden');

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[SEOQaz Debug] Active tab retrieved:', tab?.url);

      // Check for restricted URLs
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        console.error('[SEOQaz Debug] Restricted URL detected:', tab.url);
        throw new Error('Cannot access chrome://, edge://, about:, or extension pages');
      }

      // Check if it's a Google search page
      const isGoogleSearch = tab.url && tab.url.includes('google.com/search');
      console.log('[SEOQaz Debug] Is Google Search page:', isGoogleSearch);

      if (isGoogleSearch) {
        console.log('[SEOQaz Debug] Injecting SERP analysis script...');
        // Inject SERP analysis script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: injectSERPAnalysis
        });
      }

      console.log('[SEOQaz Debug] Executing content script...');
      // Execute the content script to get SEO data
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: isGoogleSearch ? extractGoogleSERPData : extractSEOData
      });

      const seoData = result.result;
      console.log('[SEOQaz Debug] Received SEO data:', seoData);
      console.log('[SEOQaz Debug] Tab URL:', tab.url);

      // Сохраняем данные для поиска, включая URL
      // Fix: Check if seoData is valid before assigning properties
      if (seoData && typeof seoData === 'object') {
        window.currentPageData = seoData;
        window.currentPageData.url = tab.url;
        console.log('[SEOQaz Debug] Page data saved successfully');
      } else {
        console.warn('[SEOQaz Debug] Invalid seoData received, using empty object');
        window.currentPageData = { url: tab.url };
      }

      // Display the results
      if (isGoogleSearch) {
        console.log('[SEOQaz Debug] Displaying SERP results...');
        displaySERPResults(seoData);
      } else {
        console.log('[SEOQaz Debug] Displaying SEO results...');
        // Проверяем, что данные не пустые
        if (seoData && seoData.title) {
          displayResults(seoData);
          displayHeadings(seoData);
          displayLinks(seoData);
          displayContent(seoData);
          displayImages(seoData);
        } else {
          console.warn('[SEOQaz Debug] No valid SEO data received, using mock data');
          displayMockData();
        }
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
      console.error('[SEOQaz Debug] Error analyzing page:', error);
      console.error('[SEOQaz Debug] Error stack:', error.stack);
      
      // Show user-friendly error message
      if (results) {
        results.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Error</h2>
            </div>
            <div class="card-content">
              <p class="status-error">❌ ${error.message}</p>
              <p style="margin-top: 12px; color: hsl(var(--muted-foreground));">
                ${error.message.includes('chrome://') ? 
                  'This extension cannot analyze browser internal pages (chrome://, edge://, etc.). Please navigate to a regular webpage.' :
                  'Unable to analyze this page. Please try refreshing the page or navigating to a different website.'}
              </p>
            </div>
          </div>
        `;
      }

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
        <div style="display: flex; align-items: center; flex: 1;">
          <span class="heading-level">${heading.level.toUpperCase()}</span>
          <span class="heading-text">${heading.text}</span>
        </div>
        <button class="copy-btn" data-text="${heading.text}" title="Copy to clipboard">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    `).join('');

    // Add copy functionality
    attachCopyHandlers(headingsStructure);
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
        <div style="display: flex; align-items: center; flex: 1;">
          <span class="heading-level">${escapeHtml(heading.level).toUpperCase()}</span>
          <span class="heading-text">${escapeHtml(heading.text)}</span>
        </div>
        <button class="copy-btn" data-text="${escapeHtml(heading.text)}" title="Copy to clipboard">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    `).join('');

    // Add copy functionality
    attachCopyHandlers(headingsStructure);
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
      // Поддержка английского, русского и казахского языков
      // Note: \b word boundaries don't work with Cyrillic/Kazakh characters in JavaScript
      const words = linkTexts.match(/[a-zA-Zа-яёӘәІіҢңҒғҮүҰұҚқӨөҺһ]{3,}/g) || [];
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

    if (!imagesOverview || !imagesList) return;

    if (!data || !data.imagesList) {
      imagesOverview.innerHTML = '<div class="no-results">No image data available</div>';
      return;
    }

    // Статистика изображений
    imagesOverview.innerHTML = `
      <div class="images-summary">
        <div class="image-stat">
          <span class="image-stat-value">${data.images.total}</span>
          <span class="image-stat-label">Total Images</span>
        </div>
        <div class="image-stat">
          <span class="image-stat-value">${data.images.missingAlt}</span>
          <span class="image-stat-label">Missing Alt</span>
        </div>
        <div class="image-stat">
          <span class="image-stat-value">${data.images.total - data.images.missingAlt}</span>
          <span class="image-stat-label">With Alt</span>
        </div>
      </div>
    `;

    // Список изображений (ограничиваем до 20)
    const imagesToShow = data.imagesList.slice(0, 20);
    const imagesHtml = imagesToShow.map((img, index) => {
      const isSmall = (img.width < 100 || img.height < 100);
      const smallClass = isSmall ? 'small-image show' : '';
      return `
      <div class="image-item ${smallClass}" data-width="${img.width}" data-height="${img.height}">
        <div class="image-preview">
          <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt || 'No alt text')}" loading="lazy" 
               class="preview-img" style="max-width: 60px; max-height: 60px;">
        </div>
        <div class="image-details">
          <div class="image-src">${escapeHtml(img.src)}</div>
          <div class="image-alt ${img.alt ? 'has-alt' : 'no-alt'}">
            Alt: ${img.alt ? escapeHtml(img.alt) : '<em>Missing</em>'}
          </div>
          <div class="image-size">${img.width}x${img.height}px${isSmall ? ' <i class="fas fa-icons" style="color: var(--muted-foreground);"></i>' : ''}</div>
        </div>
      </div>
    `;
    }).join('');

    imagesList.innerHTML = imagesHtml +
      (data.imagesList.length > 20 ? `<p class="show-more">Showing first 20 of ${data.imagesList.length} images</p>` : '');

    // Add error handlers to images
    imagesList.querySelectorAll('.preview-img').forEach(img => {
      img.addEventListener('error', function() {
        this.style.display = 'none';
      });
    });

    // Add toggle small images functionality
    const toggleBtn = document.getElementById('toggle-small-images-btn');
    if (toggleBtn && !toggleBtn.hasAttribute('data-listener-attached')) {
      toggleBtn.setAttribute('data-listener-attached', 'true');
      
      toggleBtn.addEventListener('click', function() {
        const smallImages = imagesList.querySelectorAll('.small-image');
        const isActive = this.classList.toggle('active');
        
        if (isActive) {
          smallImages.forEach(img => img.classList.remove('show'));
          this.innerHTML = '<i class="fas fa-eye"></i> Show Small Images';
        } else {
          smallImages.forEach(img => img.classList.add('show'));
          this.innerHTML = '<i class="fas fa-filter"></i> Hide Small Images';
        }
      });
    }
  }

  // Display content analysis
  function displayContent(data) {
    const contentOverview = document.getElementById('content-overview');
    if (!contentOverview) return;

    if (!data || !data.contentData) {
      console.warn('No content data available');
      return;
    }

    const contentData = data.contentData;
    const readingTime = Math.ceil(contentData.wordCount / 200); // Average reading speed

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
        <span class="content-stat-value">${readingTime}</span>
        <span class="content-stat-label">Min Read</span>
      </div>
    `;

    // Display word lists
    if (contentData.singleWords) {
      const singleWordsList = Object.entries(contentData.singleWords).map(([word, data]) => ({
        word: word,
        count: data.count,
        percentage: parseFloat(data.percentage)
      }));
      displayWordList('single-words-list', singleWordsList);
    }

    if (contentData.doubleWords) {
      const doubleWordsList = Object.entries(contentData.doubleWords).map(([phrase, data]) => ({
        phrase: phrase,
        count: data.count,
        percentage: parseFloat(data.percentage)
      }));
      displayWordList('double-words-list', doubleWordsList);
    }

    if (contentData.tripleWords) {
      const tripleWordsList = Object.entries(contentData.tripleWords).map(([phrase, data]) => ({
        phrase: phrase,
        count: data.count,
        percentage: parseFloat(data.percentage)
      }));
      displayWordList('triple-words-list', tripleWordsList);
    }
  }

  // This function runs in the context of the web page
  function extractSEOData() {
    console.log('Extracting SEO data from page...');
    
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

    console.log('Initial data object created');

    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      data.metaDescription = metaDesc.getAttribute('content') || '';
    }

    // Analyze images
    const images = document.querySelectorAll('img');
    data.images.total = images.length;
    console.log('Found', images.length, 'images');

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        data.images.missingAlt++;
      }
      
      // Добавляем в детальный список
      data.imagesList.push({
        src: img.src || img.getAttribute('data-src') || '',
        alt: alt || '',
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
        loading: img.getAttribute('loading') || ''
      });
    });

    // Extract detailed headings
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log('Found', headingElements.length, 'headings');
    
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
    console.log('Found', links.length, 'links');

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

    // Extract and analyze page content
    function extractTextContent() {
      console.log('Extracting text content...');
      
      // Создаем копию body для безопасной работы
      const bodyClone = document.body.cloneNode(true);
      
      // Удаляем элементы, которые не содержат основной контент
      const elementsToRemove = bodyClone.querySelectorAll(
        'script, style, noscript, iframe, object, embed, nav, header, footer, aside, menu'
      );
      elementsToRemove.forEach(el => el.remove());

      // Получаем весь текст
      let fullText = bodyClone.textContent || bodyClone.innerText || '';
      
      // Очищаем текст
      fullText = fullText
        .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на одиночные
        .replace(/\n+/g, ' ')  // Заменяем переносы строк на пробелы
        .replace(/\t+/g, ' ')  // Заменяем табы на пробелы
        .trim();

      console.log('Extracted text length:', fullText.length);
      return fullText;
    }

    const textContent = extractTextContent();

    // Анализ контента
    const words = textContent.toLowerCase()
      .match(/[a-zA-Zа-яёӘәІіҢңҒғҮүҰұҚқӨөҺһ]{3,}/g) || [];

    // Фильтруем стоп-слова (английские, русские и казахские)
    const stopWords = STOP_WORDS;

    const filteredWords = words.filter(word => !stopWords.has(word) && word.length > 2);
    console.log('Filtered words count:', filteredWords.length);

    data.contentData.wordCount = filteredWords.length;
    data.contentData.charCount = textContent.length;
    data.contentData.paragraphCount = document.querySelectorAll('p').length;
    data.contentData.sentenceCount = (textContent.match(/[.!?]+/g) || []).length;

    // Count word frequencies
    const wordFreq = {};
    filteredWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top single words
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
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
      const phrase = `${filteredWords[i]} ${filteredWords[i + 1]}`;
      doubleWordFreq[phrase] = (doubleWordFreq[phrase] || 0) + 1;
    }

    const sortedDoubleWords = Object.entries(doubleWordFreq)
      .filter(([,count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
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
      const phrase = `${filteredWords[i]} ${filteredWords[i + 1]} ${filteredWords[i + 2]}`;
      tripleWordFreq[phrase] = (tripleWordFreq[phrase] || 0) + 1;
    }

    const sortedTripleWords = Object.entries(tripleWordFreq)
      .filter(([,count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
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

    console.log('SEO data extraction completed:', data);
    return data;
  }

  // Extract Google SERP data
  function extractGoogleSERPData() {
    console.log('Extracting Google SERP data...');
    
    const data = {
      query: '',
      totalResults: 0,
      results: []
    };

    // Extract search query
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
      data.query = searchInput.value;
    }

    // Extract total results count
    const resultStats = document.querySelector('#result-stats');
    if (resultStats) {
      const statsText = resultStats.textContent;
      const match = statsText.match(/[\d,]+/);
      if (match) {
        data.totalResults = match[0].replace(/,/g, '');
      }
    }

    // Extract organic search results
    const searchResults = document.querySelectorAll('.g:not(.ads-ad)');
    
    searchResults.forEach((result, index) => {
      const titleElement = result.querySelector('h3');
      const linkElement = result.querySelector('a');
      const snippetElement = result.querySelector('.VwiC3b, .yXK7lf, .lEBKkf');
      
      if (titleElement && linkElement) {
        data.results.push({
          position: index + 1,
          title: titleElement.textContent.trim(),
          url: linkElement.href,
          snippet: snippetElement ? snippetElement.textContent.trim() : ''
        });
      }
    });

    console.log('Extracted SERP data:', data);
    return data;
  }

  // Функция для инъекции SERP анализа
  function injectSERPAnalysis() {
    // Проверяем, не инъектирован ли уже скрипт
    if (window.serpAnalysisInjected) return;
    window.serpAnalysisInjected = true;

    // SERP элементы для определения
    const serpFeatures = {
      'Featured Snippets': {
        selectors: ['[data-attrid="FeaturedSnippet"]', '.xpdopen', '.kp-blk', '.g-blk'],
        description: 'Concise answers pulled from websites'
      },
      'Top Ads': {
        selectors: ['.ads-ad', '.uEierd', '[data-text-ad]', '.commercial-unit-desktop-top'],
        description: 'Text-based advertisements at top'
      },
      'Bottom Ads': {
        selectors: ['.commercial-unit-desktop-rhs', '.commercial-unit-desktop-bottom'],
        description: 'Text-based advertisements at bottom'
      },
      'Video Carousels': {
        selectors: ['.video-carousel', '[role="listbox"]', '.eKjLze'],
        description: 'Collections of video results'
      },
      'Rich Snippets': {
        selectors: ['.review-stars', '.rating', '.recipe', '.event'],
        description: 'Enhanced information like reviews and ratings'
      },
      'Sitelinks': {
        selectors: ['.sVXRqc', '.usJj9c', '.osl'],
        description: 'Additional links within website results'
      },
      'People Also Ask': {
        selectors: ['.related-question-pair', '.JlqpRe', '.cskcD'],
        description: 'Related questions and answers'
      },
      'Local Pack': {
        selectors: ['.VkpGBb', '.rllt__link', '.C8TUKc'],
        description: 'Map and local business listings'
      },
      'Knowledge Panel': {
        selectors: ['.kp-wholepage', '.knowledge-panel', '.xpdopen'],
        description: 'Informative boxes about entities'
      },
      'Image Pack': {
        selectors: ['.tn-images', '.bRMDJf', '.islrc'],
        description: 'Grids of thumbnails'
      },
      'Top Stories': {
        selectors: ['.F9rcV', '.CEMjEf', '.YEMaTe'],
        description: 'News stories carousel'
      },
      'AI Overviews': {
        selectors: ['.ai-overview', '.SGExMc', '.ifM9O'],
        description: 'AI-generated summaries'
      }
    };

    let counter = 1;
    const foundFeatures = new Set();

    // Функция для добавления номера к элементу
    function addNumberToElement(element, number) {
      if (element.querySelector('.serp-number')) return; // Уже пронумерован

      const numberBadge = document.createElement('div');
      numberBadge.className = 'serp-number';
      numberBadge.textContent = number;
      numberBadge.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        background: #1a73e8;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;

      element.style.position = 'relative';
      element.appendChild(numberBadge);
    }

    // Определяем органические результаты
    const organicResults = document.querySelectorAll('.g:not(.ads-ad):not(.commercial-unit-desktop-top)');
    organicResults.forEach((result, index) => {
      addNumberToElement(result, counter++);
    });

    // Определяем SERP элементы
    Object.entries(serpFeatures).forEach(([featureName, config]) => {
      config.selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundFeatures.add(featureName);
          elements.forEach(element => {
            // Добавляем класс для идентификации
            element.classList.add('serp-feature', featureName.toLowerCase().replace(/\s+/g, '-'));

            // Добавляем номер если это не органический результат
            if (!element.closest('.g')) {
              addNumberToElement(element, counter++);
            }
          });
        }
      });
    });

    // Создаем панель с найденными элементами
    const existingPanel = document.getElementById('serp-features-panel');
    if (existingPanel) existingPanel.remove();

    const featuresPanel = document.createElement('div');
    featuresPanel.id = 'serp-features-panel';
    featuresPanel.style.cssText = `
      position: fixed;
      top: 100px;
      left: 20px;
      width: 280px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-height: 500px;
      overflow-y: auto;
      font-family: arial, sans-serif;
    `;

    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      color: #202124;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1;
    `;
    panelHeader.innerHTML = `
      <span>SERP Features (${foundFeatures.size})</span>
      <button id="close-serp-panel" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; line-height: 1; color: #5f6368;">×</button>
    `;

    const panelContent = document.createElement('div');
    panelContent.style.cssText = 'padding: 8px;';

    if (foundFeatures.size > 0) {
      const featuresList = Array.from(foundFeatures).map(feature => {
        const config = serpFeatures[feature];
        return `
          <div style="padding: 8px; border-bottom: 1px solid #f0f0f0; cursor: pointer;" 
               class="serp-feature-item" data-feature="${feature.toLowerCase().replace(/\s+/g, '-')}">
            <div style="font-weight: 500; color: #1a73e8; font-size: 14px;">${feature}</div>
            <div style="font-size: 12px; color: #5f6368; margin-top: 2px;">${config.description}</div>
          </div>
        `;
      }).join('');
      panelContent.innerHTML = featuresList;
    } else {
      panelContent.innerHTML = '<div style="padding: 16px; text-align: center; color: #5f6368;">No special SERP features detected</div>';
    }

    featuresPanel.appendChild(panelHeader);
    featuresPanel.appendChild(panelContent);
    document.body.appendChild(featuresPanel);

    // Обработчики событий
    const closeBtn = document.getElementById('close-serp-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        featuresPanel.remove();
      });
    }

    // Подсветка элементов при наведении
    document.querySelectorAll('.serp-feature-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        const featureClass = item.dataset.feature;
        document.querySelectorAll(`.${featureClass}`).forEach(el => {
          el.style.outline = '2px solid #1a73e8';
          el.style.backgroundColor = 'rgba(26, 115, 232, 0.1)';
        });
      });

      item.addEventListener('mouseleave', () => {
        const featureClass = item.dataset.feature;
        document.querySelectorAll(`.${featureClass}`).forEach(el => {
          el.style.outline = '';
          el.style.backgroundColor = '';
        });
      });
    });

    // Закрытие панели при клике вне её
    document.addEventListener('click', (e) => {
      if (!featuresPanel.contains(e.target)) {
        featuresPanel.style.display = 'none';
      }
    });

    // Кнопка для показа/скрытия панели
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        featuresPanel.style.display = featuresPanel.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Обновляем функцию извлечения данных
  function extractSEOData() {
    console.log('Extracting SEO data from page...');
    
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

    console.log('Initial data object created');

    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      data.metaDescription = metaDesc.getAttribute('content') || '';
    }

    // Analyze images
    const images = document.querySelectorAll('img');
    data.images.total = images.length;
    console.log('Found', images.length, 'images');

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        data.images.missingAlt++;
      }
      
      // Добавляем в детальный список
      data.imagesList.push({
        src: img.src || img.getAttribute('data-src') || '',
        alt: alt || '',
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
        loading: img.getAttribute('loading') || ''
      });
    });

    // Extract detailed headings
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    console.log('Found', headingElements.length, 'headings');
    
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
    console.log('Found', links.length, 'links');

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

    // Extract and analyze page content
    function extractTextContent() {
      console.log('Extracting text content...');
      
      // Создаем копию body для безопасной работы
      const bodyClone = document.body.cloneNode(true);
      
      // Удаляем элементы, которые не содержат основной контент
      const elementsToRemove = bodyClone.querySelectorAll(
        'script, style, noscript, iframe, object, embed, nav, header, footer, aside, menu'
      );
      elementsToRemove.forEach(el => el.remove());

      // Получаем весь текст
      let fullText = bodyClone.textContent || bodyClone.innerText || '';
      
      // Очищаем текст
      fullText = fullText
        .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на одиночные
        .replace(/\n+/g, ' ')  // Заменяем переносы строк на пробелы
        .replace(/\t+/g, ' ')  // Заменяем табы на пробелы
        .trim();

      console.log('Extracted text length:', fullText.length);
      return fullText;
    }

    const textContent = extractTextContent();

    // Анализ контента
    const words = textContent.toLowerCase()
      .match(/[a-zA-Zа-яёӘәІіҢңҒғҮүҰұҚқӨөҺһ]{3,}/g) || [];

    // Фильтруем стоп-слова (английские, русские и казахские)
    const stopWords = STOP_WORDS;

    const filteredWords = words.filter(word => !stopWords.has(word) && word.length > 2);
    console.log('Filtered words count:', filteredWords.length);

    data.contentData.wordCount = filteredWords.length;
    data.contentData.charCount = textContent.length;
    data.contentData.paragraphCount = document.querySelectorAll('p').length;
    data.contentData.sentenceCount = (textContent.match(/[.!?]+/g) || []).length;

    // Count word frequencies
    const wordFreq = {};
    filteredWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Get top single words
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
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
      const phrase = `${filteredWords[i]} ${filteredWords[i + 1]}`;
      doubleWordFreq[phrase] = (doubleWordFreq[phrase] || 0) + 1;
    }

    const sortedDoubleWords = Object.entries(doubleWordFreq)
      .filter(([,count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
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
      const phrase = `${filteredWords[i]} ${filteredWords[i + 1]} ${filteredWords[i + 2]}`;
      tripleWordFreq[phrase] = (tripleWordFreq[phrase] || 0) + 1;
    }

    const sortedTripleWords = Object.entries(tripleWordFreq)
      .filter(([,count]) => count > 1)
      .sort(([,a], [,b]) => b - a)
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

    console.log('SEO data extraction completed:', data);
    return data;
  }
});
