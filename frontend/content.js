// --- Client-side cache ---
const responseCache = new Map();

// Global variables
let explainButton = null;
let overlay = null;
let currentSelectedText = '';
let currentContext = '';
let simplifiedPageText = null;

//  Fetches explanations from the backend, with client-side caching.
async function fetchExplanation(text, difficulty, context) {
  const explanationDiv = overlay.querySelector(".eli5-explanation");

  const cacheKey = `explain::${difficulty}::${context}::${text}`;
  if (responseCache.has(cacheKey)) {
    console.log("Client cache hit for explanation!");
    explanationDiv.innerHTML = marked.parse(responseCache.get(cacheKey));
    return;
  }

  if (explanationDiv) {
    explanationDiv.innerHTML = "<em>Loading...</em>";
  }

  try {
    const response = await fetch("https://eli5-backend-qd9n.onrender.com/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, difficulty, context }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (explanationDiv) {
      const explanationHtml = marked.parse(data.explanation);
      explanationDiv.innerHTML = explanationHtml;
      responseCache.set(cacheKey, data.explanation);
    }

  } catch (error) {
    if (explanationDiv) {
      explanationDiv.innerText = "Sorry, something went wrong. Please try again.";
    }
    console.error("Error fetching explanation:", error);
  }
}


//  Creates and displays the main overlay.
function showOverlay(text, context) {
  currentSelectedText = text;
  currentContext = context;

  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.id = 'eli5-overlay';
  
  // Create structure, but leave text <p> empty for safety
  overlay.innerHTML = `
    <button id="eli5-close-btn" class="eli5-close-btn">&times;</button>
    <div class="eli5-header">
      <strong>Explaining:</strong>
      <div class="eli5-difficulty-controls">
        <button class="eli5-difficulty-btn active" data-difficulty="like i'm 5">ELI5</button>
        <button class="eli5-difficulty-btn" data-difficulty="high school">High School</button>
        <button class="eli5-difficulty-btn" data-difficulty="expert">Expert</button>
      </div>
    </div>
    <p class="eli5-original-text"></p>
    <hr>
    <div class="eli5-explanation"></div>
  `;

  // ---  Use .textContent to safely insert user-selected text ---
  overlay.querySelector('.eli5-original-text').textContent = text;
  
  document.body.appendChild(overlay);

  // --- Use event delegation for difficulty buttons ---
  const difficultyControls = overlay.querySelector('.eli5-difficulty-controls');
  difficultyControls.addEventListener('click', (event) => {
    const button = event.target.closest('.eli5-difficulty-btn');
    if (!button) return;

    // Remove 'active' from all siblings
    difficultyControls.querySelectorAll('.eli5-difficulty-btn').forEach(btn => btn.classList.remove('active'));
    // Add 'active' to the clicked button
    button.classList.add('active');
      
    const newDifficulty = button.dataset.difficulty;
    fetchExplanation(currentSelectedText, newDifficulty, currentContext);
  });

  // --- functions for closing the overlay ---
  function closeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
      document.removeEventListener('click', closeOverlayOnClickOutside);
    }
  }

  function closeOverlayOnClickOutside(event) {
    if (overlay && !overlay.contains(event.target)) {
      closeOverlay();
    }
  }

  overlay.querySelector('#eli5-close-btn').addEventListener('click', closeOverlay);

  // Add the listener for clicking outside the overlay
  setTimeout(() => {
    document.addEventListener('click', closeOverlayOnClickOutside);
  }, 0);

  // Initial fetch
  fetchExplanation(currentSelectedText, "like i'm 5", currentContext);
}

//  Main event listener for text selection
document.addEventListener('mouseup', (event) => {
  if ((overlay && overlay.contains(event.target)) || (explainButton && explainButton.contains(event.target))) {
    return;
  }

  if (explainButton) {
    explainButton.remove();
    explainButton = null;
  }

  const selectedText = window.getSelection().toString().trim();

  if (selectedText.length > 0) {
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    let contextText = null;

    const parentElement = range.commonAncestorContainer.parentElement;
    if (parentElement) {
        contextText = parentElement.innerText;
    }

    explainButton = document.createElement('button');
    explainButton.id = 'eli5-button';
    explainButton.innerText = 'Explain ✨';
    
    explainButton.style.position = 'absolute';
    explainButton.style.top = `${window.scrollY + rect.bottom + 5}px`;
    explainButton.style.left = `${window.scrollX + rect.left}px`;

    explainButton.addEventListener('click', () => {
      showOverlay(selectedText, contextText);
      if (explainButton) {
        explainButton.remove();
        explainButton = null;
      }
    });

    document.body.appendChild(explainButton);
  }
});

// --- LOGIC FOR FULL-PAGE SIMPLIFICATION ---

//  Extracts the main readable content from the current webpage.
function extractMainContent() {
  const main = document.querySelector('main') || document.querySelector('article');
  if (main) return main.innerText;
  
  let bestElement = document.body;
  let maxTextLength = 0;
  document.querySelectorAll('div, section').forEach(el => {
    // A simple filter to avoid navs/footers
    const role = el.getAttribute('role');
    const id = el.id.toLowerCase();
    const elClass = el.className.toLowerCase();
    
    if (role === 'navigation' || role === 'contentinfo' || id.includes('nav') || id.includes('footer') || elClass.includes('nav') || elClass.includes('footer')) {
      return;
    }

    if (el.innerText.length > maxTextLength) {
      maxTextLength = el.innerText.length;
      bestElement = el;
    }
  });
  return bestElement.innerText;
}


//  Fetches the simplified content from the backend, with client-side caching.
async function fetchSimplification(pageText, mode) {
  const contentDiv = document.getElementById('sidebar-content');
  if (!contentDiv) return;

  const cacheKey = `simplify::${mode}::${pageText}`;
  if (responseCache.has(cacheKey)) {
    console.log("Client cache hit for simplification!");
    contentDiv.innerHTML = marked.parse(responseCache.get(cacheKey));
    contentDiv.classList.remove('loading');
    return;
  }

  contentDiv.innerHTML = `<p>Reading the page and preparing your explanation...</p>`;
  contentDiv.classList.add('loading');

  try {
    const response = await fetch("https://eli5-backend-qd9n.onrender.com/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_content: pageText, mode: mode }),
    });
    const data = await response.json();
    const simplificationHtml = marked.parse(data.simplification);
    contentDiv.innerHTML = simplificationHtml;
    contentDiv.classList.remove('loading');

    responseCache.set(cacheKey, data.simplification);

    // Update active button style
    document.querySelector('.sidebar-mode-btn.active').classList.remove('active');
    document.getElementById(`sidebar-mode-${mode}`).classList.add('active');

  } catch (error) {
    contentDiv.innerHTML = "Sorry, there was an error simplifying this page.";
    console.error("Simplification error:", error);
  }
}

//  Creates and shows the sidebar UI.
function createSimplificationSidebar() {
  const existingSidebar = document.getElementById('eli5-sidebar');
  if (existingSidebar) {
    existingSidebar.remove();
    simplifiedPageText = null; // Clear cache when closing
    return;
  }

  if (!simplifiedPageText) {
      simplifiedPageText = extractMainContent();
  }

  const sidebar = document.createElement('div');
  sidebar.id = 'eli5-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>Simplifying Page</h3>
      <div class="sidebar-mode-controls">
        <button id="sidebar-mode-eli5" class="sidebar-mode-btn active" data-mode="eli5">ELI5</button>
        <button id="sidebar-mode-adult" class="sidebar-mode-btn" data-mode="adult">Deeper Dive</button>
      </div>
      <button id="sidebar-close-btn" class="eli5-close-btn">&times;</button>
    </div>
    <p class="sidebar-subtitle">You can also select text on the page for a quick explanation.</p>
    <hr class="sidebar-divider">
    <div id="sidebar-content"></div>
  `;
  document.body.appendChild(sidebar);

  document.getElementById('sidebar-close-btn').addEventListener('click', () => {
    sidebar.remove();
    simplifiedPageText = null; // Clear cache when closing
  });

  // --- SIMPLICITY: Use event delegation for mode buttons ---
  const modeControls = sidebar.querySelector('.sidebar-mode-controls');
  modeControls.addEventListener('click', (event) => {
    const button = event.target.closest('.sidebar-mode-btn');
    if (!button || button.classList.contains('active')) return;

    modeControls.querySelectorAll('.sidebar-mode-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    fetchSimplification(simplifiedPageText, button.dataset.mode);
  });

  // Automatically fetch the default ELI5 summary on open
  fetchSimplification(simplifiedPageText, 'eli5');
}

//  Creates the floating action button and adds it to the page.
function createFloatingActionButton() {
    const fab = document.createElement('button');
    fab.id = 'eli5-fab';
    fab.innerHTML = '✨'; 
    fab.title = 'Simplify this Page';

    fab.addEventListener('click', createSimplificationSidebar);

    document.body.appendChild(fab);
}

// --- INITIATE: Create the floating button when the page loads ---
createFloatingActionButton();