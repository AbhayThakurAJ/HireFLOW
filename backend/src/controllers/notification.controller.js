import prisma from '../utils/prisma.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!notification) return res.status(404).json({ success: false, error: 'Not found' });
    
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update' });
  }
};
