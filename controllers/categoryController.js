import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category exists
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      description: description || "",
      isPredefined: false,
      createdBy: req.user.userId,
      followers: [],
    });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
};

export const initializeDefaultCategories = async () => {
  try {
    const defaultCategories = [
      { name: 'Science', description: 'Science and technology quizzes' },
      { name: 'Math', description: 'Mathematics quizzes' },
      { name: 'History', description: 'History and historical events' },
      { name: 'Geography', description: 'Geography and world knowledge' },
      { name: 'Technology', description: 'Technology and programming' },
      { name: 'Sports', description: 'Sports and athletics' },
      { name: 'Entertainment', description: 'Entertainment and pop culture' },
    ];

    for (const catData of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: catData.name },
        { ...catData, isPredefined: true },
        { upsert: true, new: true }
      );
    }

    console.log('Default categories initialized');
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

