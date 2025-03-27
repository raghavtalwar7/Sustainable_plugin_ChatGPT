# Sustainable_plugin_ChatGPT
## Google Chrome (and other Chromium-based browsers)
1. Clone the repository.
2. After cloning the repository go to this chrome://extensions/ url and enable developer mode.
3. There will be a load unpacked option on the top left of this page.
4. Click on it and navigate to the location where you cloned this repository. Select the folder. Now you should be able to see the plugin.

## Firefox
1. Clone the repository.
2. Change line 33 in `manifest.json` from `"service_worker": "background.js"` to `"scripts": ["background.js"]`.
3. Go to about:debugging and select "This Firefox".
4. Click on "Load Temporary Add-On...".
5. Navigate to the `carbon-emissions` folder and select any file in it. You should now be able to use the plugin.
