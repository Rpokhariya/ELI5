# ELI5 - Explain Like I'm 5

A Chrome browser extension that simplifies complex text into easy-to-understand explanations using AI.  
Whether you select a specific piece of text or want the entire page explained — ELI5 helps you grasp it at your preferred depth.

---

## Features

- **Text Selection Explanation**
- Select any text on a webpage to get instant explanations
- Choose between **three modes** of understanding:

  - **ELI5:** Simplest explanation (Explain Like I’m 5)
  - **High School:** Balanced level, moderate technical depth
  - **Expert:** In-depth and detailed explanation

- **Full-Page Explanation**
- Use the floating **FAB (floating action button)** to explain the **entire webpage** in one click
- Choose between **two difficulty levels**:

  - **ELI5 Mode** — Simplified overview
  - **Dive Mode** — Deeper, more analytical explanation

- **Quick Access**

  - Access directly via browser toolbar or the floating action button

- **Universal Compatibility**

  - Works seamlessly across all websites

- **Simple & Intuitive Interface**
  - Clean design focused on clarity and accessibility

---

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Browser APIs:** Chrome Extension APIs
- **Backend:** Fast API
- **AI Model:** Google Gemini (for text simplification and explanations)

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- Chrome browser

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Rpokhariya/ELI5.git
cd ELI5
```

### Step 2: Setup Backend (FastAPI)

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set Google API key in the env:

```
$env:GEMINI_API_KEY="your_gemini_api_key_here"
```

5. Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend server will run on `http://localhost:8000`

**Note:** The backend server must be running for the extension to work.

### Step 3: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`

2. Enable "Developer mode" (toggle in top-right corner)

3. Click "Load unpacked" and select the extension directory

4. The ELI5 extension icon will appear in your toolbar

## How to Use

### For Full Page Explanation:

1. Navigate to any webpage
2. Click the FAB icon that appears on the page
3. Choose between simple or detailed explanation mode
4. Read the explanation

### For Selected Text Explanation:

1. Select any text on a webpage
2. Click the ELI5 extension icon in the toolbar
3. Choose your preferred explanation mode:
   - ELI5 (simplest)
   - Casual (conversational)
   - Technical (detailed)
4. Read the explanation

## Project Structure

```
ELI5/
├── backend/
│   ├── main.py            # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables (API key)
├── extension/
│   ├── manifest.json      # Extension configuration
│   ├── popup.html         # Popup UI
│   ├── popup.js           # Popup logic
│   ├── content.js         # Content script (FAB & text selection)
│   ├── background.js      # Background script
│   ├── styles.css         # Styles
│   └── icons/             # Extension icons
```

## Technology Stack

- **Frontend:** HTML/CSS/JavaScript
- **Backend:** Python, FastAPI
- **AI:** Google Gemini API

## Author

**Rpokhariya**

- GitHub: [@Rpokhariya](https://github.com/Rpokhariya)

---

Made to make complex concepts simple and accessible.
