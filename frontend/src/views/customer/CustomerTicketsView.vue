<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Search, TicketIcon, ChevronLeft, ChevronRight, CircleAlert, Plus } from "lucide-vue-next";
import type { Pagination } from "@/types/type";
import type { CustomerTicket, CustomerTicketFilters, TicketCategory, TicketPriority, TicketStatus } from "@/modules/tickets/type";
import { ticketsService } from "@/modules/tickets/ticket.service";
import type { Socket } from "socket.io-client";
import { connectSocket } from "@/lib/socket";

const router = useRouter();
const tickets = ref<CustomerTicket[]>([]);
const pagination = ref<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
const search = ref("");
const status = ref<TicketStatus | "">("");
const priority = ref<TicketPriority | "">("");
const isLoading = ref(false);
const errorMessage = ref("");
let socket: Socket | null = null;

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Terbuka",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const categoryLabels: Record<TicketCategory, string> = {
  SHIPPING: "Pengiriman",
  PAYMENT: "Pembayaran",
  ACCOUNT: "Akun",
  TECHNICAL: "Teknis",
  PRODUCT: "Produk",
  OTHER: "Lainnya",
};

const statusClasses: Record<TicketStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-600/20",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const priorityClasses: Record<TicketPriority, string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadTickets(page = 1) {
  isLoading.value = true;
  errorMessage.value = "";

  const filters: CustomerTicketFilters = {
    page,
    limit: pagination.value.limit,
    search: search.value.trim() || undefined,
    status: status.value || undefined,
    priority: priority.value || undefined,
  };

  try {
    const result = await ticketsService.getMyTickets(filters);
    tickets.value = result.data.items;
    pagination.value = result.data.pagination;
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message ?? "Daftar tiket gagal dimuat. Silakan coba lagi.";
  } finally {
    isLoading.value = false;
  }
}

function applyFilters() {
  loadTickets(1);
}

function changePage(page: number) {
  if (page < 1 || page > pagination.value.totalPages || isLoading.value) return;
  loadTickets(page);
}

function openTicket(ticketId: string) {
  router.push({ name: "customer-ticket-detail", params: { id: ticketId } });
}

function openCreateTicket() {
  router.push({ name: "customer-open-ticket" });
}

function handleUnreadUpdate(payload: { ticketId: string }) {
  void loadTickets(pagination.value.page);
}

onMounted(() => {
  void loadTickets();

  socket = connectSocket();
  socket.on("ticket:unread:update", handleUnreadUpdate);
});

onBeforeUnmount(() => {
  socket?.off("ticket:unread:update", handleUnreadUpdate);
  socket = null;
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Tiket Saya</h2>
        <p class="mt-1 text-sm text-slate-500">Lihat status pengajuan bantuan dan percakapan tiket kamu.</p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <button type="button" class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer" @click="openCreateTicket">
          <Plus :size="17" />
          Buat tiket
        </button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 p-5 sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 class="font-bold text-slate-900">Daftar tiket</h3>
            <p class="mt-1 text-sm text-slate-500">Cari tiket berdasarkan nomor atau judul, lalu filter sesuai status dan prioritas.</p>
          </div>

          <form class="grid gap-3 sm:grid-cols-2 xl:flex" @submit.prevent="applyFilters">
            <div class="relative sm:col-span-2 xl:w-72">
              <Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input v-model="search" type="search" placeholder="Cari nomor atau judul tiket..." class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" />
            </div>

            <select v-model="status" class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 cursor-pointer">
              <option value="">Semua status</option>
              <option value="OPEN">Terbuka</option>
              <option value="IN_PROGRESS">Diproses</option>
              <option value="RESOLVED">Selesai</option>
              <option value="CLOSED">Ditutup</option>
            </select>

            <select v-model="priority" class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 cursor-pointer">
              <option value="">Semua prioritas</option>
              <option value="LOW">Rendah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Tinggi</option>
              <option value="URGENT">Mendesak</option>
            </select>

            <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer" :disabled="isLoading">
              <Search :size="16" />
              Cari
            </button>
          </form>
        </div>
      </div>

      <div v-if="errorMessage" class="m-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        <CircleAlert :size="18" class="mt-0.5 shrink-0" />
        <p>{{ errorMessage }}</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left">
          <thead class="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-6 py-4">Tiket</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Prioritas</th>
              <th class="px-6 py-4">Dibuat</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading && tickets.length === 0">
              <td colspan="6" class="px-6 py-16 text-center text-sm text-slate-500">Memuat daftar tiket...</td>
            </tr>

            <tr v-else-if="!isLoading && tickets.length === 0">
              <td colspan="6" class="px-6 py-16 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <TicketIcon :size="22" />
                </div>
                <p class="mt-3 font-semibold text-slate-700">Tiket tidak ditemukan</p>
                <p class="mt-1 text-sm text-slate-400">Coba ubah kata kunci atau filter, atau buat tiket baru.</p>
                <button type="button" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 cursor-pointer" @click="openCreateTicket">
                  <Plus :size="16" />
                  Buat tiket
                </button>
              </td>
            </tr>

            <tr v-for="ticket in tickets" :key="ticket.id" class="transition hover:bg-slate-50/70">
              <td class="px-6 py-4">
                <p class="text-xs font-semibold text-indigo-600">{{ ticket.ticketNumber }}</p>
                <div class="flex items-center gap-2">
                  <button type="button" class="mt-1 block max-w-xs truncate text-left text-sm font-semibold text-slate-800 transition hover:text-indigo-600">
                    {{ ticket.subject }}
                  </button>
                  <span v-if="ticket.unreadCount > 0" class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    <span class="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                    {{ ticket.unreadCount }} pesan
                  </span>
                </div>
                <p class="mt-1 max-w-xs truncate text-xs text-slate-400">{{ ticket.description }}</p>
              </td>

              <td class="px-6 py-4">
                <span class="whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">{{ categoryLabels[ticket.category] }}</span>
              </td>

              <td class="px-6 py-4">
                <span class="whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset" :class="statusClasses[ticket.status]">{{ statusLabels[ticket.status] }}</span>
              </td>

              <td class="px-6 py-4">
                <span class="whitespace-nowrap text-sm font-semibold" :class="priorityClasses[ticket.priority]">{{ priorityLabels[ticket.priority] }}</span>
              </td>

              <td class="whitespace-nowrap px-6 py-4 text-xs text-slate-500">{{ formatDate(ticket.createdAt) }}</td>

              <td class="px-6 py-4 text-right">
                <button type="button" class="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer" @click="openTicket(ticket.id)">Lihat detail</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p class="text-sm text-slate-500">
          Menampilkan <span class="font-semibold text-slate-700">{{ tickets.length ? (pagination.page - 1) * pagination.limit + 1 : 0 }}–{{ (pagination.page - 1) * pagination.limit + tickets.length }}</span>
          dari <span class="font-semibold text-slate-700">{{ pagination.total }}</span> tiket
        </p>

        <div class="flex items-center gap-2">
          <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="isLoading || pagination.page <= 1" @click="changePage(pagination.page - 1)">
            <ChevronLeft :size="16" />
            Sebelumnya
          </button>

          <span class="px-2 text-sm font-medium text-slate-600">{{ pagination.page }} / {{ pagination.totalPages || 1 }}</span>

          <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" :disabled="isLoading || pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">
            Berikutnya
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
