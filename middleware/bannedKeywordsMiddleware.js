import { filterBannedKeywordsFromObject } from '../utils/bannedKeywords.js';

/**
 * Middleware to filter banned keywords from request body
 */
export const filterBannedKeywords = async (req, res, next) => {
  try {
    // Fields to check for banned keywords
    const fieldsToFilter = ['questionText', 'options', 'title', 'description', 'bio', 'text'];

    if (req.body) {
      req.body = await filterBannedKeywordsFromObject(req.body, fieldsToFilter);
    }

    next();
  } catch (error) {
    console.error('Error in banned keywords middleware:', error);
    next(); // Continue even if there's an error
  }
};

