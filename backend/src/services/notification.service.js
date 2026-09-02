const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser, emitToRole } = require('../config/socket');
const { ApiError } = require('../middleware/errorHandler');

const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  link = '',
  priority = 'medium',
  metadata = {}
}) => {
  const notification = new Notification({
    userId,
    title,
    message,
    type,
    link,
    priority,
    metadata
  });

  await notification.save();

  // Real-time WebSocket emission
  emitToUser(userId.toString(), 'notification.created', notification);

  return notification;
};

const createRoleNotifications = async ({
  role,
  title,
  message,
  type = 'system',
  link = '',
  priority = 'medium',
  metadata = {},
  excludeUserId = null
}) => {
  const query = { role, status: 'active' };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const users = await User.find(query);
  if (users.length === 0) return [];

  const notifications = users.map((u) => ({
    userId: u._id,
    title,
    message,
    type,
    link,
    priority,
    metadata
  }));

  const created = await Notification.insertMany(notifications);

  // Broadcast to role room
  emitToRole(role, 'notification.created', {
    title,
    message,
    type,
    link,
    priority,
    metadata
  });

  return created;
};

const getUserNotifications = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.isRead !== undefined) {
    query.isRead = filters.isRead === 'true' || filters.isRead === true;
  }
  if (filters.type) {
    query.type = filters.type;
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false })
  ]);

  return {
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: notifications
  };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ userId, isRead: false });
  return { unreadCount: count };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) throw ApiError.notFound('Notification not found');

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { message: 'All notifications marked as read', modifiedCount: result.modifiedCount };
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!notification) throw ApiError.notFound('Notification not found');

  return { message: 'Notification deleted successfully' };
};

module.exports = {
  createNotification,
  createRoleNotifications,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
