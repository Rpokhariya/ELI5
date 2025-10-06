document.addEventListener('DOMContentLoaded', () => {
  const eli5Button = document.getElementById('simplify-eli5');
  const adultButton = document.getElementById('simplify-adult');

  async function sendMessageToContentScript(mode) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: "simplifyPage", mode: mode });
      window.close(); // Close the popup after clicking
    }
  }

  eli5Button.addEventListener('click', () => {
    sendMessageToContentScript('eli5');
  });

  adultButton.addEventListener('click', () => {
    sendMessageToContentScript('adult');
  });
});