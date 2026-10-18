
import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

type UserRole = "CUSTOMER" | "ADMIN";

type SocketUser = {
  id: string;
  role: UserRole;
};

type RoomAck = (response: {
  success: boolean;
  message: string;
}) => void;

let io: Server | null = null;

export function getTicketPublicRoom(ticketId: string) {
  return `ticket:${ticketId}:public`;
}

export function getTicketAdminRoom(ticketId: string) {
  return `ticket:${ticketId}:admins`;
}

function getSocketUser(socket: Socket): SocketUser {
  return socket.data.user as SocketUser;
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (typeof token !== "string" || !token) {
      return next(new Error("Autentikasi dibutuhkan"));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: "ai-customer-support",
      });

      if (typeof payload === "string" || !payload.sub || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")) {
        return next(new Error("Token tidak valid"));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive || user.role !== payload.role) {
        return next(
          new Error("User tidak valid atau tidak aktif")
        );
      }

      socket.data.user = {
        id: user.id,
        role: user.role as UserRole,
      };

      next();
    } catch {
      next(new Error("Token kadaluarsa atau tidak valid"));
    }
  });

  io.on("connection", async(socket) => {
    const user = getSocketUser(socket);

    console.log(`Socket connected: ${socket.id} | User: ${user.id} | Role: ${user.role}`);

    await socket.join(`user:${user.id}`);
    
    if (user.role === "ADMIN") {
      await socket.join("role:ADMIN");
    }

    socket.on(
      "ticket:join",
      async (payload: { ticketId?: string }, acknowledge?: RoomAck) => {
        try {
          const ticketId = payload?.ticketId;

          if (typeof ticketId !== "string" || !ticketId.trim()) {
            acknowledge?.({
              success: false,
              message: "ID tiket tidak valid",
            });
            return;
          }

          const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
              id: true,
              customerId: true,
            },
          });

          if (!ticket) {
            acknowledge?.({
              success: false,
              message: "Tiket tidak ditemukan",
            });
            return;
          }

          if (user.role === "CUSTOMER" && ticket.customerId !== user.id) {
            acknowledge?.({
              success: false,
              message: "Akses ke tiket ditolak",
            });
            return;
          }

          await socket.join(getTicketPublicRoom(ticket.id));

          if (user.role === "ADMIN") {
            await socket.join(getTicketAdminRoom(ticket.id));
          }

          acknowledge?.({
            success: true,
            message: "Berhasil masuk ke room tiket",
          });
        } catch (error) {
          console.error("Gagal bergabung ke room tiket:", error);

          acknowledge?.({
            success: false,
            message: "Gagal bergabung ke room tiket",
          });
        }
      }
    );

    socket.on(
      "ticket:leave",
      async (payload: { ticketId?: string }, acknowledge?: RoomAck) => {
        const ticketId = payload?.ticketId;

        if (typeof ticketId !== "string" || !ticketId.trim()) {
          acknowledge?.({
            success: false,
            message: "ID tiket tidak valid",
          });
          return;
        }

        await socket.leave(getTicketPublicRoom(ticketId));

        if (user.role === "ADMIN") {
          await socket.leave(getTicketAdminRoom(ticketId));
        }

        acknowledge?.({
          success: true,
          message: "Berhasil keluar dari room tiket",
        });
      }
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO belum diinisialisasi.");
  }

  return io;
}
