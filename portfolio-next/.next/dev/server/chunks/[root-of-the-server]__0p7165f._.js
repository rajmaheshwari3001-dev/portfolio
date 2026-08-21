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
"[project]/app/api/activity/leetcode/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function GET() {
    const username = "rajmaheshwari3001-dev";
    const query = `
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            profile {
                ranking
                realName
            }
            submitStats {
                acSubmissionNum { difficulty count }
                totalSubmissionNum { difficulty count }
            }
            languageProblemCount {
                languageName
                problemsSolved
            }
            tagProblemCounts {
                advanced { tagName tagSlug problemsSolved }
                intermediate { tagName tagSlug problemsSolved }
            }
        }
        userContestRanking(username: $username) {
            rating globalRanking
        }
        recentAcSubmissionList(username: $username, limit: 5) {
            title
            timestamp
        }
    }
  `;
    try {
        const res = await fetch("https://leetcode.com/graphql", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables: {
                    username
                }
            }),
            next: {
                revalidate: 3600
            } // Cache for 1 hour
        });
        if (!res.ok) {
            throw new Error(`LeetCode API responded with status: ${res.status}`);
        }
        const json = await res.json();
        const data = json.data;
        const userData = data?.matchedUser;
        if (!userData) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                status: "unavailable",
                message: "User not found or private"
            });
        }
        const statsArray = userData.submitStats?.acSubmissionNum || [];
        const totalSubsArray = userData.submitStats?.totalSubmissionNum || [];
        const contest = data.userContestRanking || {};
        const profile = userData.profile || {};
        const formattedStats = {
            All: 0,
            Easy: 0,
            Medium: 0,
            Hard: 0
        };
        statsArray.forEach((item)=>{
            if (formattedStats[item.difficulty] !== undefined) {
                formattedStats[item.difficulty] = item.count;
            }
        });
        let totalSubmitted = 0;
        const totalAccepted = formattedStats.All;
        totalSubsArray.forEach((item)=>{
            if (item.difficulty === "All") {
                totalSubmitted = item.count;
            }
        });
        const acceptanceRate = totalSubmitted > 0 ? Number((totalAccepted / totalSubmitted * 100).toFixed(1)) : 0;
        const languages = (userData.languageProblemCount || []).sort((a, b)=>b.problemsSolved - a.problemsSolved).slice(0, 5).map((lang)=>({
                name: lang.languageName,
                solved: lang.problemsSolved
            }));
        const skills = [];
        [
            'advanced',
            'intermediate'
        ].forEach((level)=>{
            const tags = (userData.tagProblemCounts || {})[level] || [];
            tags.slice(0, 4).forEach((tag)=>{
                skills.push({
                    name: tag.tagName,
                    count: tag.problemsSolved,
                    level
                });
            });
        });
        const recent = (data.recentAcSubmissionList || []).map((sub)=>({
                title: sub.title,
                timestamp: sub.timestamp
            }));
        const calendar = Array.from({
            length: 50
        }, ()=>Math.floor(Math.random() * 5));
        const result = {
            status: "connected",
            stats: formattedStats,
            ranking: profile.ranking || "N/A",
            contest_ranking: contest.globalRanking || "N/A",
            contest_rating: contest.rating ? Math.round(contest.rating) : "N/A",
            acceptance_rate: acceptanceRate,
            total_submissions: totalSubmitted,
            languages,
            skills,
            recent,
            calendar,
            url: `https://leetcode.com/u/${username}/`,
            last_updated: Date.now()
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: result
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            status: "unavailable",
            error: error.message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0p7165f._.js.map