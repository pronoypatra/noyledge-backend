import BannedKeyword from '../models/BannedKeyword.js';

export const getBannedKeywords = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const keywords = await BannedKeyword.find().sort({ word: 1 });
    res.json(keywords);
  } catch (error) {
    console.error('Error getting banned keywords:', error);
    res.status(500).json({ message: 'Error fetching banned keywords' });
  }
};

export const addBannedKeyword = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { word } = req.body;

    if (!word || typeof word !== 'string') {
      return res.status(400).json({ message: 'Word is required' });
    }

    const keyword = await BannedKeyword.findOneAndUpdate(
      { word: word.toLowerCase() },
      { word: word.toLowerCase(), addedBy: req.user.userId },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: 'Banned keyword added successfully',
      keyword,
    });
  } catch (error) {
    console.error('Error adding banned keyword:', error);
    res.status(500).json({ message: 'Error adding banned keyword' });
  }
};

export const deleteBannedKeyword = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { keywordId } = req.params;

    await BannedKeyword.findByIdAndDelete(keywordId);

    res.json({ message: 'Banned keyword deleted successfully' });
  } catch (error) {
    console.error('Error deleting banned keyword:', error);
    res.status(500).json({ message: 'Error deleting banned keyword' });
  }
};

