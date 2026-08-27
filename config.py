import os
from dotenv import load_dotenv

# Load environment variables from .env BEFORE reading any of them.
# This module is imported by app.py *before* app.py could call load_dotenv(),
# so the load has to happen here or GEMINI_API_KEY / GITHUB_TOKEN come back None.
# We point at the .env sitting next to this file so it works regardless of CWD.
# On hosts like Vercel there is no .env file (vars are injected), and load_dotenv
# simply no-ops without overriding the real environment.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

PROFILE_CONFIG = {
    "name": "Raj Maheshwari",
    "github_username": "rajmaheshwari3001-dev",  # Updated with actual
    "leetcode_username": "9760497925",  # Actual LeetCode profile
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
