<div align="center">

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=800&size=40&pause=1000&color=d97706&center=true&vCenter=true&width=800&lines=%E2%9A%A1+RAJ+MAHESHWARI+%7C+Software+Engineer;Building+Intelligent+Systems;Luxury+UI+%26+Fluid+Typography;Interactive+AI+Inference)](https://portfolio-lilac-delta-c1kxu40gza.vercel.app)

[![Live Deployment](https://img.shields.io/badge/LIVE_DEPLOYMENT-portfolio.vercel.app-050505?style=for-the-badge&logo=vercel&logoColor=d97706)](https://portfolio-lilac-delta-c1kxu40gza.vercel.app)

</div>

---

Welcome to the source code of my personal developer portfolio. This isn't just a static webpage; it's a **high-performance, luxury-themed web application** designed to demonstrate my capabilities in backend engineering, API integration, interactive UNIX terminal simulation, and premium frontend design.

## 🏗️ System Architecture

This application dynamically pulls my real-time coding activity while meticulously managing external API rate limits through a custom caching layer.

```mermaid
graph TD
    %% Styling with vibrant colors
    classDef client fill:#0F172A,stroke:#00F0FF,stroke-width:2px,color:#00F0FF;
    classDef backend fill:#0F172A,stroke:#A855F7,stroke-width:2px,color:#A855F7;
    classDef external fill:#0F172A,stroke:#F59E0B,stroke-width:2px,color:#F59E0B;
    classDef cache fill:#1E293B,stroke:#F43F5E,stroke-width:2px,stroke-dasharray: 5 5,color:#F43F5E;

    %% Nodes
    A[Three.js Frontend WebGL Client]:::client
    B[Flask API Application]:::backend
    C((In-Memory Cache Layer TTL 30m)):::cache
    D[GitHub REST API Profile, Repos, Languages]:::external
    E[LeetCode GraphQL API Activity, Stats]:::external

    %% Relationships
    A -- Asynchronous Fetch --> B
    B -- Check Valid Data --> C
    C -- Cache Miss / Expired --> D
    C -- Cache Miss / Expired --> E
    D -- Return JSON --> C
    E -- Return JSON --> C
    C -- Cache Hit --> B
```

## ✨ Engineering Highlights

- **Interactive AI Neural Interface:** A custom-built, interactive sentiment inference widget right in the UI. Type any sentence to simulate real-time tensor processing and receive a live Positive/Negative/Neutral classification with confidence metrics.
- **Generative WebGL Architecture:** Features a stunning, fluid particle wave background rendered with Three.js that reacts dynamically to mouse and scroll physics, simulating liquid obsidian and gold.
- **Tech Luxury UI & Fluid Typography:** Utilizes mathematical `clamp()` functions to ensure typography acts like water—scaling perfectly on every device, from massive 4K monitors to mobile phones.
- **Intelligent API Caching (Backend):** To prevent hitting the severe rate limits of the LeetCode and GitHub APIs, the Flask backend implements a custom Time-To-Live (TTL) cache. It safely stores the fetched payloads for 30 minutes, ensuring ultra-fast load times.
- **Premium Glassmorphic Design:** Avoids heavy CSS frameworks in favor of hand-written, ultra-performant custom CSS. Features deep 24px frosted glass, premium metallic gradients (Gold, Champagne, Silver), and luxurious obsidian hover-glows.
- **Dynamic Mobile Navigation:** Features a highly responsive, custom-built mobile pill navigation. Integrated with the Lenis smooth scrolling engine and a custom IntersectionObserver ScrollSpy, it dynamically slides a colored background pill to the active section with flawless 60FPS CSS transitions.

<details>
<summary><b>💻 View Tech Stack</b></summary>
<br>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white" />
  <img src="https://img.shields.io/badge/LeetCode_API-FFA116?style=for-the-badge&logo=leetcode&logoColor=black" />
</p>
</details>

## 🚀 Local Development Setup

To run this application locally and explore the architecture yourself, follow this terminal workflow.

<details>
<summary><b>View Setup Instructions</b></summary>
<br>

**1. Clone & Navigate**
```bash
git clone https://github.com/rajmaheshwari3001-dev/portfolio.git
cd portfolio
```

**2. Isolate Dependencies**
```bash
python -m venv venv

# Windows Activation:
venv\Scripts\activate

# macOS/Linux Activation:
source venv/bin/activate
```

**3. Install Requirements**
```bash
pip install -r requirements.txt
```

**4. Environment Variables**
> [!TIP]
> To bypass GitHub's unauthenticated IP rate limits, export a Personal Access Token.

```bash
# Windows (PowerShell)
$env:GITHUB_TOKEN="your_token_here"

# macOS/Linux
export GITHUB_TOKEN="your_token_here"
```

**5. Boot the Server**
```bash
python app.py
```
*The API and Frontend will now be served at [http://localhost:5000](http://localhost:5000).*
</details>

## 📁 Repository Map

```text
portfolio/
├── services/               # API interaction logic (GitHub/LeetCode)
│   ├── github_service.py
│   └── leetcode_service.py
├── static/                 # Static assets (CSS, JS, 3D Models)
├── templates/              # Flask Jinja2 HTML templates
│   └── index.html
├── app.py                  # Main Flask application & Caching Router
├── config.py               # Application configurations & secrets mapping
├── requirements.txt        # Python dependency manifest
└── README.md               # You are here
```

## 📬 Let's Connect

If you're interested in the architecture or just want to chat about software engineering, reach out!

<p align="left">
  <a href="https://www.linkedin.com/in/raj-maheshwari-6293683a4/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://github.com/rajmaheshwari3001-dev" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="mailto:rajmaheshwari3001@gmail.com" target="_blank">
    <img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
  </a>
</p>
