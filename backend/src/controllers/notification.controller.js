const mongoose = require("mongoose");

const { Notification } = require("../models/Notification");
const createHttpError = require("../utils/httpError");

function mapNotification(notification) {
  return {
    id: notification.id,
    recipientUserId: notification.recipientUserId,
    studentId: notification.studentId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    payload: notification.payload,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

async function listNotifications(request, response, next) {
  try {
    const page = Math.max(Number(request.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(request.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;

    const query = {
      recipientUserId: request.authUser.id,
    };

    if (request.query.isRead === "true") {
      query.isRead = true;
    }

    if (request.query.isRead === "false") {
      query.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
    ]);

    response.status(200).json({
      notifications: notifications.map(mapNotification),
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function markNotificationAsRead(request, response, next) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid notification id");
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipientUserId: request.authUser.id,
      },
      {
        $set: {
          isRead: true,
        },
      },
      {
        new: true,
      }
    );

    if (!notification) {
      throw createHttpError(404, "Notification not found");
    }

    response.status(200).json({
      notification: mapNotification(notification),
    });
  } catch (error) {
    next(error);
  }
}

async function markAllNotificationsAsRead(request, response, next) {
  try {
    const result = await Notification.updateMany(
      {
        recipientUserId: request.authUser.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    response.status(200).json({
      message: "Notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
