import Chat from '../models/Chat.js';
import User from '../models/User.js';

export const getChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all chats where user is a participant
    const chats = await Chat.find({
      participants: userId,
    })
      .populate('participants', 'name email avatar')
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
        options: { sort: { timestamp: -1 }, limit: 1 }, // Get only last message for preview
      })
      .sort({ lastMessageAt: -1 });

    // Verify mutual follow for each chat and filter out chats where mutual follow is broken
    const currentUser = await User.findById(userId);
    const validChats = [];

    for (const chat of chats) {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      if (otherParticipant) {
        const otherUser = await User.findById(otherParticipant._id);
        
        // Check mutual follow
        const currentUserFollowsOther = currentUser.following.some(
          id => id.toString() === otherParticipant._id.toString()
        );
        const otherUserFollowsCurrent = otherUser.followers.some(
          id => id.toString() === userId.toString()
        );

        if (currentUserFollowsOther && otherUserFollowsCurrent) {
          validChats.push(chat);
        }
      }
    }

    res.json(validChats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
};

export const createChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (userId === participantId) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
    }).populate('participants', 'name email avatar');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [userId, participantId],
        messages: [],
      });

      chat = await Chat.findById(chat._id).populate('participants', 'name email avatar');
    }

    res.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Error creating chat' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      id => id.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Chat.findById(chatId)
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
        options: { sort: { timestamp: 1 } }, // Sort by timestamp ascending (oldest first)
      })
      .select('messages');

    res.json(messages.messages || []);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      id => id.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Verify mutual follow still exists
    const otherParticipantId = chat.participants.find(
      id => id.toString() !== userId.toString()
    );
    
    if (otherParticipantId) {
      const currentUser = await User.findById(userId);
      const otherUser = await User.findById(otherParticipantId);

      const currentUserFollowsOther = currentUser.following.some(
        id => id.toString() === otherParticipantId.toString()
      );
      const otherUserFollowsCurrent = otherUser.followers.some(
        id => id.toString() === userId.toString()
      );

      if (!currentUserFollowsOther || !otherUserFollowsCurrent) {
        return res.status(403).json({ 
          message: 'Both users must follow each other to send messages' 
        });
      }
    }

    // Add message
    chat.messages.push({
      sender: userId,
      text: text.trim(),
      timestamp: new Date(),
    });

    chat.lastMessageAt = new Date();
    await chat.save();

    // Populate sender info using dot notation for nested documents
    await chat.populate('messages.sender', 'name avatar');

    // Get the last message (which is the one we just added)
    const message = chat.messages[chat.messages.length - 1];
    
    // Format message data for response
    const messageData = {
      _id: message._id,
      sender: message.sender ? {
        _id: message.sender._id,
        name: message.sender.name,
        avatar: message.sender.avatar,
      } : { _id: userId },
      text: message.text,
      timestamp: message.timestamp,
    };

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: messageData,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};

