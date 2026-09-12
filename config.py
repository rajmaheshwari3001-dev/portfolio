import os
from dotenv import load_dotenv

# Load environment variables from .env BEFORE reading any of them.
# This module is imported by app.py *before* app.py could call load_dotenv(),
# so the load has to happen here or GEMINI_API_KEY / GITHUB_TOKEN come back None.
# We point at the .env sitting next to this file so it works regardless of CWD.
# On hosts like Vercel there is no .env file (vars are injected), and load_dotenv
# simply no-ops without overriding the real environment.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

_GITHUB_USERNAME = "rajmaheshwari3001-dev"  # Actual

PROFILE_CONFIG = {
    "name": "Raj Maheshwari",
    "role": "AI / ML Developer",
    "tagline": "Building intelligent systems at the intersection of machine learning, data, and software engineering.",
    "bio": "B.Tech AI/ML student at GLA University, Mathura. I build intelligent software systems — from data pipelines and ML models to full-stack web applications. My work sits at the intersection of machine learning, backend engineering, and data analysis.",
    "github_username": _GITHUB_USERNAME,
    "github_url": f"https://github.com/{_GITHUB_USERNAME}",
    "leetcode_username": "9760497925",  # Actual LeetCode profile
    "linkedin_username": "raj-maheshwari-6293683a4",
    "linkedin_url": "https://www.linkedin.com/in/raj-maheshwari-6293683a4/",
    "email": "rajmaheshwari3001@gmail.com",
    "resume_url": "#resume"
}

# In production, these should come from os.environ.get()
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", None)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", None)

# Preferred Gemini model. Defaults to the rolling "flash-lite-latest" alias:
# a fast, low-latency model (~1-2s replies) that Google keeps pointed at the
# current lite model, so this config doesn't rot when a specific version is
# retired for new users. NOTE: the heavier "gemini-flash-latest" resolves to a
# "thinking" model that took ~30s per reply in testing — far too slow for a
# chat widget — so we prefer the lite tier here. The app falls back through a
# list of known-good models if this one is unavailable. Override via GEMINI_MODEL.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest")

# Model names belong in configuration, not in application logic: Google retires
# them on their own schedule and the fallback chain should be editable without
# touching app.py. Tried in order after GEMINI_MODEL, first responder wins.
GEMINI_FALLBACK_MODELS = [
    m.strip()
    for m in os.environ.get(
        "GEMINI_FALLBACK_MODELS",
        "gemini-flash-lite-latest,gemini-3.5-flash-lite,gemini-flash-latest",
    ).split(",")
    if m.strip()
]

# Canonical origin for SEO. Left unset, the app derives the URL from the
# incoming request — which is correct for preview deployments but means the
# canonical changes per host. Set SITE_URL to the real production domain so
# every environment advertises one stable canonical URL.
SITE_URL = os.environ.get("SITE_URL", "").rstrip("/") or None

# Abuse protection for the public, unauthenticated /api/chat endpoint. A
# portfolio does not need a CAPTCHA; it needs a ceiling.
CHAT_RATE_LIMIT_REQUESTS = int(os.environ.get("CHAT_RATE_LIMIT_REQUESTS", "12"))
CHAT_RATE_LIMIT_WINDOW = int(os.environ.get("CHAT_RATE_LIMIT_WINDOW", "60"))  # seconds
CHAT_MAX_MESSAGES = int(os.environ.get("CHAT_MAX_MESSAGES", "24"))
CHAT_MAX_MESSAGE_CHARS = int(os.environ.get("CHAT_MAX_MESSAGE_CHARS", "2000"))
CHAT_TIMEOUT_SECONDS = float(os.environ.get("CHAT_TIMEOUT_SECONDS", "20"))

# Shown in the footer and in developer diagnostics so it is always obvious
# which build someone is looking at.
BUILD_VERSION = os.environ.get("BUILD_VERSION", "3.3")
BUILD_DATE = os.environ.get("BUILD_DATE", "2026.09")
