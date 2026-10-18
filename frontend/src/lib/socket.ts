import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(): Socket {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        throw new Error("Token autentikasi tidak ditemukan.");
    }

    if (!socket) {
        socket = io(import.meta.env.VITE_SOCKET_URL, {
            autoConnect: false,
            auth: { token },
        });
    }

    socket.auth = { token };

    if (!socket.connected) {
        socket.connect();
    }

    return socket;
}