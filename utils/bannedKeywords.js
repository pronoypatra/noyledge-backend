import BannedKeyword from '../models/BannedKeyword.js';

/**
 * Replace banned keywords in text with ***
 */
export const replaceBannedKeywords = async (text) => {
  if (!text || typeof text !== 'string') return text;

  try {
    // Get all banned keywords from database
    const bannedKeywords = await BannedKeyword.find({});
    const keywords = bannedKeywords.map(k => k.word);

    if (keywords.length === 0) return text;

    // Create regex pattern that matches words (case-insensitive)
    let filteredText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      filteredText = filteredText.replace(regex, '***');
    });

    return filteredText;
  } catch (error) {
    console.error('Error filtering banned keywords:', error);
    return text; // Return original text if error
  }
};

/**
 * Check if text contains banned keywords
 */
export const containsBannedKeywords = async (text) => {
  if (!text || typeof text !== 'string') return false;

  try {
    const bannedKeywords = await BannedKeyword.find({});
    const keywords = bannedKeywords.map(k => k.word);

    if (keywords.length === 0) return false;

    const lowerText = text.toLowerCase();
    return keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  } catch (error) {
    console.error('Error checking banned keywords:', error);
    return false;
  }
};

/**
 * Filter object fields that might contain banned keywords
 */
export const filterBannedKeywordsFromObject = async (obj, fields) => {
  const filtered = { ...obj };
  
  for (const field of fields) {
    if (filtered[field]) {
      if (Array.isArray(filtered[field])) {
        // Handle arrays (e.g., options array)
        filtered[field] = await Promise.all(
          filtered[field].map(async (item) => {
            if (typeof item === 'string') {
              return await replaceBannedKeywords(item);
            } else if (item && typeof item === 'object' && item.optionText) {
              return {
                ...item,
                optionText: await replaceBannedKeywords(item.optionText),
              };
            }
            return item;
          })
        );
      } else if (typeof filtered[field] === 'string') {
        filtered[field] = await replaceBannedKeywords(filtered[field]);
      }
    }
  }

  return filtered;
};

