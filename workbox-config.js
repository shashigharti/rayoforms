module.exports = {
    "globDirectory": "public/",
    "globPatterns": [
        "**/*.css",
        "**/*.png",
        "**/*.js",
        "**/*.woff",
        "**/*.woff2",
        "**/*.ttf",
        "**/*.ico",
        "**/*.html",
        "manifest.json"
    ],
    "swDest": "public/sw.js",
    "swSrc": "resources/js/sw.js",
    "maximumFileSizeToCacheInBytes": 10 * 1024 * 1024
};
