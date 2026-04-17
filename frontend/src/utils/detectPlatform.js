const platformMap = {
    'facebook': 'https://facebook.com',
    'fb': 'https://facebook.com',
    'gmail': 'https://mail.google.com',
    'google': 'https://google.com',
    'instagram': 'https://instagram.com',
    'ig': 'https://instagram.com',
    'twitter': 'https://twitter.com',
    'x': 'https://x.com',
    'linkedin': 'https://linkedin.com',
    'github': 'https://github.com',
    'youtube': 'https://youtube.com',
    'netflix': 'https://netflix.com',
    'amazon': 'https://amazon.com',
    'apple': 'https://apple.com',
    'microsoft': 'https://microsoft.com',
    'reddit': 'https://reddit.com',
    'pinterest': 'https://pinterest.com',
    'tiktok': 'https://tiktok.com',
    'spotify': 'https://spotify.com'
};

export const detectPlatforms = (text) => {
    const foundPlatforms = [];
    if (!text) return foundPlatforms;
    
    // Convert to lowercase and match words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    for (const word of words) {
        if (platformMap[word]) {
            // Check if already in list to avoid duplicates
            if (!foundPlatforms.find(p => p.name === word)) {
                foundPlatforms.push({
                    name: word.charAt(0).toUpperCase() + word.slice(1),
                    url: platformMap[word]
                });
            }
        }
    }
    
    return foundPlatforms;
};
