# AI Customer Support Ticketing System

Sistem layanan pelanggan berbasis kecerdasan buatan (Artificial Intelligence) yang dirancang untuk membantu pengelolaan tiket pelanggan dan pembuatan draf balasan secara otomatis menggunakan AI.

Proyek ini dikembangkan sebagai proyek portofolio Full-Stack Developer dengan teknologi Vue.js, Node.js, TypeScript, PostgreSQL, dan Docker.

## Fitur Utama
- **Autentikasi Pengguna** -  Login untuk pengguna yang memiliki akses ke sistem.
- **Manajemen Tiket** - Membuat, melihat, dan mengelola tiket layanan pelanggan.
- **AI Assisted Replies** - Membantu membuat draf balasan tiket menggunakan Groq API.
- **Real-Time Communication** - Pembaruan data secara real-time menggunakan Socket.IO.
- **Dashboard Analitik** - Menampilkan informasi analitik terkait tiket layanan pelanggan.
- **Audit Logs** - Mencatat aktivitas tertentu di dalam sistem.
- **Background Jobs** - Pemrosesan tugas latar belakang menggunakan Redis dan BullMQ.
- **Database Management** - Pengelolaan basis data menggunakan PostgreSQL dan Prisma ORM.
- **Docker Support** - Menjalankan aplikasi dan layanan pendukung melalui Docker Compose.

## Teknologi yang Digunakan
### Frontend
- Vue 3
- TypeScript
- Tailwind CSS
- Vite
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Socket.IO
- Groq API
- Json Web Token (JWT)
- Zod

## Infrastruktur
- Docker
- Docker Compose
- Nginx

## Persiapan
Pastikan perangkat telah memiliki perangkat lunak berikut:
- Docker Desktop
- Git
- API Key dari Groq

## Instalasi dan Menjalankan Aplikasi
**1. Clone Repository**
Jalankan perintah berikut di terminal:
```bash
git clone https://github.com/zackyhermawan/ai-customer-support-ticketing-system.git
cd ai-customer-support-ticketing-system
```
