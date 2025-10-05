// Global variables to hold references to our UI elements.
let explainButton = null;
let overlay = null;
let currentSelectedText = ''; // Variable to store the text being explained

/**
 * A new, reusable function to fetch explanations from the backend.
 * @param {string} text - The text to explain.
 * @param {string} difficulty - The difficulty level ('like i'm 5', 'high school', etc.).
 */
async function fetchExplanation(text, difficulty) {
  const explanationDiv = overlay.querySelector(".eli5-explanation");
  if (explanationDiv) {
    explanationDiv.innerHTML = "<em>Loading...</em>"; // Show loading text
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, difficulty: difficulty }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (explanationDiv) {
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
 * Creates and displays the main overlay on the page.
 * @param {string} text - The text that was selected by the user.
 */
function showOverlay(text) {
  currentSelectedText = text; // Store the selected text

  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.id = 'eli5-overlay';
  
  // New innerHTML with the difficulty buttons
  overlay.innerHTML = `
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

  // --- Add click listeners to the new buttons ---
  const difficultyButtons = overlay.querySelectorAll('.eli5-difficulty-btn');
  difficultyButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Remove 'active' class from all buttons
      difficultyButtons.forEach(btn => btn.classList.remove('active'));
      // Add 'active' class to the clicked button
      event.target.classList.add('active');
      
      const newDifficulty = event.target.dataset.difficulty;
      fetchExplanation(currentSelectedText, newDifficulty); // Re-fetch with new difficulty
    });
  });

  // Initial fetch when the overlay first opens
  fetchExplanation(currentSelectedText, "like i'm 5");

  setTimeout(() => {
    document.addEventListener('click', closeOverlayListener, { once: true });
  }, 0);
}

function closeOverlayListener(event) {
  if (overlay && !overlay.contains(event.target)) {
    overlay.remove();
    overlay = null;
  }
}

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

    explainButton = document.createElement('button');
    explainButton.id = 'eli5-button';
    explainButton.innerText = 'Explain ✨';
    
    explainButton.style.position = 'absolute';
    explainButton.style.top = `${window.scrollY + rect.bottom + 5}px`;
    explainButton.style.left = `${window.scrollX + rect.left}px`;

    explainButton.addEventListener('click', () => {
      showOverlay(selectedText);
      if (explainButton) {
        explainButton.remove();
        explainButton = null;
      }
    });

    document.body.appendChild(explainButton);
  }
});