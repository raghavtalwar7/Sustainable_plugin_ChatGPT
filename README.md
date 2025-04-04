# 🌿 Sustainable Plugin for ChatGPT

This plugin helps estimate the **carbon emissions** generated during ChatGPT usage, encouraging more environmentally responsible AI interaction.

## 🌱 Features

- 🔢 Estimates CO₂ emissions from ChatGPT usage
- 🧩 Plugin-ready for integration
- 💡 Encourages sustainable tech practices
- ⚙️ MIT licensed and open-source

## 📦 Installation

```bash
git clone https://github.com/raghavtalwar7/Sustainable_plugin_ChatGPT.git
```

## Google Chrome (and other Chromium-based browsers)
1. After cloning the repository go to this chrome://extensions/ url and enable developer mode.
2. There will be a load unpacked option on the top left of this page.
3. Click on it and navigate to the location where you cloned this repository. Select the folder. Now you should be able to see the plugin.

## Firefox
1. ```bash 
   cd Sustainable_plugin_ChatGPT
   ```
2. Change line 33 in `manifest.json` from `"service_worker": "background.js"` to `"scripts": ["background.js"]`.
3. Go to about:debugging and select "This Firefox".
4. Click on "Load Temporary Add-On...".
5. Navigate to the `carbon-emissions` folder and select any file in it. You should now be able to use the plugin.


# 🤝 Contributing to Sustainable Plugin for ChatGPT

Thank you for your interest in contributing! This project thrives with your help.

## 🧰 How to Contribute

1. **Fork the Repository**

   Click the "Fork" button at the top right of the GitHub page.

2. **Clone Your Fork**

   ```bash
   git clone https://github.com/<your-username>/Sustainable_plugin_ChatGPT.git
   cd Sustainable_plugin_ChatGPT
   ```
3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
    
    - Add your code

    - Add/modify tests if applicable

    - Update documentation if needed

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

    - Go to the original repo
    - Click "Compare & pull request"
    - Describe your changes and submit

## ✅ Guidelines

- Follow the existing code style

- Keep pull requests focused and minimal

- Add meaningful commit messages

- Use comments for clarity when needed

## 💬 Need Help?

Open an issue to ask questions or suggest ideas. We'd love to hear from you!