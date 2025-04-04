/**
 * Popup script for the ChatGPT Carbon Footprint Tracker
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentTokensElement = document.getElementById('current-tokens');
  const carbonFootprintElement = document.getElementById('carbon-footprint');
  const resetStatsButton = document.getElementById('reset-stats');

  function loadStats(attempt = 1, maxAttempts = 5) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].url.includes('chatgpt.com')) {
        console.log('Not on ChatGPT tab:', tabs[0] ? tabs[0].url : 'No active tab');
        currentTokensElement.textContent = 'Open ChatGPT';
        carbonFootprintElement.textContent = 'N/A';
        return;
      }

      console.log(`Attempt ${attempt}: Sending getCurrentStats to tab:`, tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getCurrentStats' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`Attempt ${attempt}: Error fetching stats:`, chrome.runtime.lastError);
          if (attempt < maxAttempts) {
            setTimeout(() => loadStats(attempt + 1, maxAttempts), 1000);
          } else {
            currentTokensElement.textContent = 'N/A';
            carbonFootprintElement.textContent = 'N/A';
          }
          return;
        }

        if (response && response.totalTokens !== undefined && response.carbonEmissions !== undefined) {
          console.log(`Attempt ${attempt}: Received response:`, response);
          currentTokensElement.textContent = response.totalTokens.toLocaleString();
          const emissions = response.carbonEmissions;
          carbonFootprintElement.textContent = emissions >= 1000
            ? `${(emissions / 1000).toFixed(2)} kg CO₂e`
            : `${emissions.toFixed(2)} g CO₂e`;
        } else {
          console.error(`Attempt ${attempt}: Invalid or no response:`, response);
          if (attempt < maxAttempts) {
            setTimeout(() => loadStats(attempt + 1, maxAttempts), 1000);
          } else {
            currentTokensElement.textContent = 'N/A';
            carbonFootprintElement.textContent = 'N/A';
          }
        }
      });
    });
  }

  function resetStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('chatgpt.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'resetStats' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error resetting stats:', chrome.runtime.lastError);
            alert('Failed to reset stats');
            return;
          }
          if (response && response.success) {
            console.log('Stats reset successfully');
            loadStats();
          } else {
            console.error('Reset failed:', response);
            alert('Failed to reset stats');
          }
        });
      }
    });
  }

  loadStats();
  setInterval(() => loadStats(), 5000);

  resetStatsButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the stats?')) {
      resetStats();
    }
  });
});