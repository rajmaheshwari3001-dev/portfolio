module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/activity/github/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const headers = GITHUB_TOKEN ? {
    Authorization: `token ${GITHUB_TOKEN}`
} : {};
async function fetchGitHubProfile(username) {
    try {
        const res = await fetch(`https://api.github.com/users/${username}`, {
            headers,
            next: {
                revalidate: 3600
            }
        });
        if (!res.ok) throw new Error(`Rate limit or error: ${res.status}`);
        return await res.json();
    } catch (err) {
        return {
            login: username,
            avatar_url: "https://avatars.githubusercontent.com/rajmaheshwari3001-dev",
            public_repos: 4,
            followers: 0,
            name: "Raj Maheshwari"
        };
    }
}
async function fetchGitHubActivity(username) {
    try {
        const res = await fetch(`https://api.github.com/users/${username}/events/public`, {
            headers,
            next: {
                revalidate: 3600
            }
        });
        if (!res.ok) throw new Error("Rate limit");
        const events = await res.json();
        return events.slice(0, 10).map((event)=>{
            const etype = event.type.replace("Event", "");
            const repoName = event.repo?.name || "";
            let title = `${etype} on ${repoName}`;
            if (etype === "Push") {
                const commits = event.payload?.commits?.length || 0;
                title = `Pushed ${commits} commits to ${repoName}`;
            } else if (etype === "Create") {
                const refType = event.payload?.ref_type || "repository";
                title = `Created ${refType} at ${repoName}`;
            }
            return {
                platform: "github",
                type: etype.toUpperCase(),
                title,
                timestamp: event.created_at,
                url: `https://github.com/${repoName}`
            };
        });
    } catch (err) {
        return [
            {
                platform: "github",
                type: "PUSH",
                title: "Pushed to aiml-bootcamp-2026",
                timestamp: "2026-08-08T10:00:00Z",
                url: "https://github.com/rajmaheshwari3001-dev/aiml-bootcamp-2026"
            },
            {
                platform: "github",
                type: "CREATE",
                title: "Created repository Excel-Data-Cleaning-Tool",
                timestamp: "2026-08-07T14:30:00Z",
                url: "https://github.com/rajmaheshwari3001-dev/Excel-Data-Cleaning-Tool"
            }
        ];
    }
}
async function fetchGitHubReposAndLanguages(username) {
    try {
        const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
            headers,
            next: {
                revalidate: 3600
            }
        });
        if (!res.ok) throw new Error("Rate limit");
        const repos = await res.json();
        const validRepos = repos.filter((r)=>!r.fork).sort((a, b)=>(b.stargazers_count || 0) - (a.stargazers_count || 0));
        const topRepos = validRepos.slice(0, 4).map((r)=>({
                name: r.name,
                url: r.html_url,
                stars: r.stargazers_count,
                language: r.language
            }));
        const langs = {};
        let total = 0;
        repos.forEach((r)=>{
            if (r.language) {
                langs[r.language] = (langs[r.language] || 0) + 1;
                total++;
            }
        });
        const langPct = {};
        if (total > 0) {
            Object.entries(langs).sort((a, b)=>b[1] - a[1]).slice(0, 5).forEach(([lang, count])=>{
                langPct[lang] = Math.round(count / total * 100);
            });
        }
        return {
            repos: topRepos,
            languages: langPct
        };
    } catch (err) {
        return {
            repos: [
                {
                    name: "aiml-bootcamp-2026",
                    url: "https://github.com/rajmaheshwari3001-dev/aiml-bootcamp-2026",
                    stars: 0,
                    language: "Jupyter Notebook"
                },
                {
                    name: "Excel-Data-Cleaning-Tool",
                    url: "https://github.com/rajmaheshwari3001-dev/Excel-Data-Cleaning-Tool",
                    stars: 0,
                    language: "Python"
                },
                {
                    name: "Trustlayer",
                    url: "https://github.com/rajmaheshwari3001-dev/Trustlayer",
                    stars: 0,
                    language: "Python"
                }
            ],
            languages: {
                Python: 75,
                "Jupyter Notebook": 25
            }
        };
    }
}
async function GET() {
    const username = "rajmaheshwari3001-dev";
    const [profile, activity, reposLangs] = await Promise.all([
        fetchGitHubProfile(username),
        fetchGitHubActivity(username),
        fetchGitHubReposAndLanguages(username)
    ]);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        success: true,
        data: {
            profile,
            activity,
            repos: reposLangs.repos,
            languages: reposLangs.languages,
            status: "connected"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1w0_r1q._.js.map