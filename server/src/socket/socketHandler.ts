import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export const initializeSocket = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user notification room
    socket.on('join-user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    // Join project room for Kanban collaboration
    socket.on('join-project', (projectId: string) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined project room: project:${projectId}`);
      }
    });

    socket.on('leave-project', (projectId: string) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left project room: project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
};

export const broadcastTaskCreated = (projectId: string, task: any) => {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit('task:created', task);
  }
};

export const broadcastTaskUpdated = (projectId: string, task: any) => {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit('task:updated', task);
  }
};

export const broadcastTaskDeleted = (projectId: string, taskId: string) => {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit('task:deleted', { taskId });
  }
};

export const broadcastCommentCreated = (projectId: string, taskId: string, comment: any) => {
  if (ioInstance) {
    ioInstance.to(`project:${projectId}`).emit('comment:created', { taskId, comment });
  }
};

export const sendNotificationToUser = (userId: string, notification: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  }
};
