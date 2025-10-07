// Global variables to hold references to our UI elements.
let explainButton = null;
let overlay = null;
let currentSelectedText = '';
let currentContext = ''; // Variable to store the surrounding context

/**
 * Fetches explanations from the backend, now including context.
 * @param {string} text - The text to explain.
 * @param {string} difficulty - The difficulty level.
 * @param {string | null} context - The surrounding text from the page.
 */


async function fetchExplanation(text, difficulty, context) {
  const explanationDiv = overlay.querySelector(".eli5-explanation");
  if (explanationDiv) {
    explanationDiv.innerHTML = "<em>Loading...</em>";
  }

  try {
    const response = await fetch("https://eli5-backend-qd9n.onrender.com/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The body includes the context field
      body: JSON.stringify({ text, difficulty, context }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (explanationDiv) {
      // Use the 'marked' library to parse Markdown from the response
      explanationDiv.innerHTML = marked.parse(data.explanation);
    }

  } catch (error) {
    if (explanationDiv) {
      explanationDiv.innerText = "Sorry, something went wrong. Please try again.";
    }
    console.error("Error fetching explanation:", error);
  }
}

/**
 * Creates and displays the main overlay, now accepting context.
 * @param {string} text - The text that was selected.
 * @param {string | null} context - The surrounding paragraph text.
 */
function showOverlay(text, context) {
  currentSelectedText = text;
  currentContext = context;

  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.id = 'eli5-overlay';
  
  overlay.innerHTML = `
    <button id="eli5-close-btn">&times;</button>
    <div class="eli5-header">
      <strong>Explaining:</strong>
      <div class="eli5-difficulty-controls">
        <button class="eli5-difficulty-btn active" data-difficulty="like i'm 5">ELI5</button>
        <button class="eli5-difficulty-btn" data-difficulty="high school">High School</button>
        <button class="eli5-difficulty-btn" data-difficulty="expert">Expert</button>
      </div>
    </div>
    <p>${text}</p>
    <hr>
    <div class="eli5-explanation"></div>
  `;
  
  document.body.appendChild(overlay);

  // Add click listeners to the difficulty buttons
  const difficultyButtons = overlay.querySelectorAll('.eli5-difficulty-btn');
  difficultyButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      const newDifficulty = event.target.dataset.difficulty;
      // Re-fetch with the new difficulty, passing the stored context
      fetchExplanation(currentSelectedText, newDifficulty, currentContext);
    });
  });

  // --- functions for closing the overlay ---
  function closeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
      // Clean up the "click outside" listener
      document.removeEventListener('click', closeOverlayOnClickOutside);
    }
  }

  function closeOverlayOnClickOutside(event) {
    if (overlay && !overlay.contains(event.target)) {
      closeOverlay();
    }
  }

  // Add click listener for the close button
  const closeButton = overlay.querySelector('#eli5-close-btn');
  closeButton.addEventListener('click', closeOverlay);

  // Add the listener for clicking outside the overlay
  setTimeout(() => {
    document.addEventListener('click', closeOverlayOnClickOutside);
  }, 0);

  // Initial fetch when the overlay first opens with context
  fetchExplanation(currentSelectedText, "like i'm 5", currentContext);
}

// Main event listener for text selection
document.addEventListener('mouseup', (event) => {
  // Ignore clicks inside our own UI elements
  if ((overlay && overlay.contains(event.target)) || (explainButton && explainButton.contains(event.target))) {
    return;
  }

  // Remove the previous "Explain" button if it exists
  if (explainButton) {
    explainButton.remove();
    explainButton = null;
  }

  const selectedText = window.getSelection().toString().trim();

  if (selectedText.length > 0) {
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    let contextText = null;

    // --- Logic to capture the context from the parent element ---
    const parentElement = range.commonAncestorContainer.parentElement;
    if (parentElement) {
        // We use innerText to get a clean text representation of the paragraph
        contextText = parentElement.innerText;
    }

    // Create and position the "Explain" button
    explainButton = document.createElement('button');
    explainButton.id = 'eli5-button';
    explainButton.innerText = 'Explain ✨';
    
    explainButton.style.position = 'absolute';
    explainButton.style.top = `${window.scrollY + rect.bottom + 5}px`;
    explainButton.style.left = `${window.scrollX + rect.left}px`;

    // When the button is clicked, show the overlay with text AND context
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

let simplifiedPageText = null; // Store page content when sidebar is open

/**
 * Extracts the main readable content from the current webpage.
 */
function extractMainContent() {
  const main = document.querySelector('main') || document.querySelector('article');
  if (main) return main.innerText;
  let bestElement = document.body;
  let maxTextLength = 0;
  document.querySelectorAll('div, section').forEach(el => {
    if (el.innerText.length > maxTextLength) {
      maxTextLength = el.innerText.length;
      bestElement = el;
    }
  });
  return bestElement.innerText;
}

/**
 * Fetches the simplified content from the backend.
 * @param {string} pageText - The full text of the page.
 * @param {string} mode - The simplification mode ('eli5' or 'Deeper Dive').
 */
async function fetchSimplification(pageText, mode) {
  const contentDiv = document.getElementById('sidebar-content');
  if (!contentDiv) return;

  contentDiv.innerHTML = `<p>Reading the page and preparing your explanation...</p>`;
  contentDiv.classList.add('loading');

  try {
    const response = await fetch("https://eli5-backend-qd9n.onrender.com/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_content: pageText, mode: mode }),
    });
    const data = await response.json();
    contentDiv.innerHTML = marked.parse(data.simplification);
    contentDiv.classList.remove('loading');

    // Update active button style
    document.querySelector('.sidebar-mode-btn.active').classList.remove('active');
    document.getElementById(`sidebar-mode-${mode}`).classList.add('active');

  } catch (error) {
    contentDiv.innerHTML = "Sorry, there was an error simplifying this page.";
    console.error("Simplification error:", error);
  }
}

/**
 * Creates and shows the sidebar UI, now with difficulty controls inside.
 */
function createSimplificationSidebar() {
  const existingSidebar = document.getElementById('eli5-sidebar');
  if (existingSidebar) {
    existingSidebar.remove();
    return; // Toggle off if it's already open
  }

  simplifiedPageText = extractMainContent(); // Extract and store content

  const sidebar = document.createElement('div');
  sidebar.id = 'eli5-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>Simplifying Page</h3>
      <div class="sidebar-mode-controls">
        <button id="sidebar-mode-eli5" class="sidebar-mode-btn active">ELI5</button>
        <button id="sidebar-mode-adult" class="sidebar-mode-btn">Deeper Dive</button>
      </div>
      <button id="sidebar-close-btn">&times;</button>
    </div>
    <p class="sidebar-subtitle">You can also select text on the page for its quick explanation.</p>
    <hr class="sidebar-divider">
    <div id="sidebar-content"></div>
  `;
  document.body.appendChild(sidebar);

  // Add event listeners for the new controls
  document.getElementById('sidebar-close-btn').addEventListener('click', () => sidebar.remove());

  document.getElementById('sidebar-mode-eli5').addEventListener('click', () => {
    fetchSimplification(simplifiedPageText, 'eli5');
  });

  document.getElementById('sidebar-mode-adult').addEventListener('click', () => {
    fetchSimplification(simplifiedPageText, 'adult');
  });

  // Automatically fetch the default ELI5 summary on open
  fetchSimplification(simplifiedPageText, 'eli5');
}

/**
 * Creates the floating action button and adds it to the page.
 */
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
