// Global variables to hold references to our UI elements.
let explainButton = null;
let overlay = null;

/**
 * Creates and displays the explanation overlay on the page.
 * It now fetches the explanation from the backend API.
 * @param {string} text - The text that was selected by the user.
 */
async function showOverlay(text) {
  console.log("Attempting to show overlay...");

  if (overlay) {
    overlay.remove();
  }

  overlay = document.createElement('div');
  overlay.id = 'eli5-overlay';
  overlay.innerHTML = `
    <div class="eli5-content">
      <strong>Explaining:</strong>
      <p>${text}</p>
      <hr>
      <div class="eli5-explanation">
        <em>Loading...</em>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  try {
    // Call our local FastAPI backend
    const response = await fetch("http://127.0.0.1:8000/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        difficulty: "like i'm 5" // We'll make this dynamic later
      }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Find the explanation div and update it with the response
    const explanationDiv = overlay.querySelector(".eli5-explanation");
    if (explanationDiv) {
      explanationDiv.innerText = data.explanation;
    }

  } catch (error) {
    // If something goes wrong, show an error message
    const explanationDiv = overlay.querySelector(".eli5-explanation");
    if (explanationDiv) {
      explanationDiv.innerText = "Sorry, something went wrong. Please try again.";
    }
    console.error("Error fetching explanation:", error);
  }

  setTimeout(() => {
    document.addEventListener('click', closeOverlayListener, { once: true });
  }, 0);
}

/**
 * A named event listener function to close the overlay.
 * It removes the overlay if a click occurs outside of it.
 * @param {MouseEvent} event - The click event.
 */
function closeOverlayListener(event) {
  if (overlay && !overlay.contains(event.target)) {
    overlay.remove();
    overlay = null;
  }
}

/**
 * The main event listener that triggers when the user releases the mouse button.
 * This is the entry point for our extension's functionality.
 */
document.addEventListener('mouseup', (event) => {
  // Ignore any clicks that happen inside our own UI (the button or the overlay).
  if ((overlay && overlay.contains(event.target)) || (explainButton && explainButton.contains(event.target))) {
    return;
  }

  // If a button from a previous selection exists, remove it.
  if (explainButton) {
    explainButton.remove();
    explainButton = null;
  }

  // Get the currently highlighted text from the page and trim whitespace.
  const selectedText = window.getSelection().toString().trim();

  // If text has been selected, proceed to create the button.
  if (selectedText.length > 0) {
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect(); // Get position and dimensions of the selection.

    // Create the "Explain" button element.
    explainButton = document.createElement('button');
    explainButton.id = 'eli5-button';
    explainButton.innerText = 'Explain ✨';
    
    // Position the button just below the highlighted text.
    explainButton.style.position = 'absolute';
    explainButton.style.top = `${window.scrollY + rect.bottom + 5}px`;
    explainButton.style.left = `${window.scrollX + rect.left}px`;

    // Add a click listener to this specific button instance.
    explainButton.addEventListener('click', () => {
      showOverlay(selectedText); // Show the overlay with the selected text.
      // Clean up the button after it has served its purpose.
      if (explainButton) {
        explainButton.remove();
        explainButton = null;
      }
    });

    // Add the button to the page.
    document.body.appendChild(explainButton);
  }
});