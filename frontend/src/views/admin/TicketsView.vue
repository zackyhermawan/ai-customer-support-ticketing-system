
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Search, RefreshCw, Ticket as TicketIcon, ChevronLeft, ChevronRight, CircleAlert } from "lucide-vue-next";
import type { Pagination } from "@/types/type";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/modules/tickets/type";
import { ticketsService } from "@/modules/tickets/ticket.service";
import { useRouter } from "vue-router";
import type { Socket } from "socket.io-client";
import { connectSocket } from "@/lib/socket";

const totalPages = computed(() => pagination.value.totalPages || 1);

const tickets = ref<Ticket[]>([]);
const pagination = ref<Pagination>({
  page: 1, 
  limit: 10,
  total: 0, 
  totalPages: 0 
});
const search = ref("");
const status = ref<TicketStatus | "">("");
const priority = ref<TicketPriority | "">("");
const category = ref<TicketCategory | "">("");
const isLoading = ref(false);
const errorMessage = ref("");
const router = useRouter();
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

const categoryLabel: Record<TicketCategory, string> = {
    SHIPPING: "Pengiriman",
    PAYMENT: "Pembayaran",
    ACCOUNT: "Akun",
    TECHNICAL: "Teknis",
    PRODUCT: "Produk",
    OTHER: "Lainnya"
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

  try {
    const result = await ticketsService.getAll({
      page,
      limit: pagination.value.limit,
      search: search.value.trim() || undefined,
      status: status.value || undefined,
      priority: priority.value || undefined,
      category: category.value || undefined
    });

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
  router.push({ name: "admin-ticket-detail", params: { id: ticketId } });
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
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">Manajemen Tiket</h2>
        <p class="mt-1 text-sm text-slate-500">Pantau dan kelola permintaan bantuan pelanggan.</p>
      </div>

      <button type="button" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer" :disabled="isLoading" @click="loadTickets(pagination.page)">
        <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }" />
        Muat ulang
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-500">Total tiket</p>
          <div class="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <TicketIcon :size="19" />
          </div>
        </div>
        <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">{{ pagination.total.toLocaleString("id-ID") }}</p>
        <p class="mt-1 text-xs text-slate-400">Sesuai filter yang diterapkan</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Halaman saat ini</p>
        <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {{ pagination.totalPages ? pagination.page : 0 }}<span class="text-lg font-medium text-slate-400"> / {{ pagination.totalPages }}</span>
        </p>
        <p class="mt-1 text-xs text-slate-400">Maksimal {{ pagination.limit }} tiket per halaman</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-medium text-slate-500">Data ditampilkan</p>
        <p class="mt-3 text-3xl font-bold tracking-tight text-slate-900">{{ tickets.length }}</p>
        <p class="mt-1 text-xs text-slate-400">Tiket pada halaman ini</p>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 p-5 sm:p-6">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 class="font-bold text-slate-900">Daftar tiket</h3>
            <p class="mt-1 text-sm text-slate-500">Cari tiket berdasarkan nomor atau judul.</p>
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

            <select v-model="category" class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 cursor-pointer">
              <option value="">Semua kategori</option>
              <option value="SHIPPING">Pengiriman</option>
              <option value="PAYMENT">Pembayaran</option>
              <option value="ACCOUNT">Akun</option>
              <option value="TECHNICAL">Teknis</option>
              <option value="PRODUCT">Produk</option>
              <option value="OTHER">Lainnya</option>
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
        <table class="w-full min-w-[1000px] text-left">
          <thead class="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th class="px-6 py-4">Tiket</th>
              <th class="px-6 py-4">Pelanggan</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Prioritas</th>
              <th class="px-6 py-4">Dibuat</th>
              <th class="px-6 py-4">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading && tickets.length === 0">
              <td colspan="7" class="px-6 py-16 text-center text-sm text-slate-500">Memuat daftar tiket...</td>
            </tr>

            <tr v-else-if="!isLoading && tickets.length === 0">
              <td colspan="7" class="px-6 py-16 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <TicketIcon :size="22" />
                </div>
                <p class="mt-3 font-semibold text-slate-700">Tiket tidak ditemukan</p>
                <p class="mt-1 text-sm text-slate-400">Coba ubah kata kunci atau filter pencarian.</p>
              </td>
            </tr>

            <tr v-for="ticket in tickets" :key="ticket.id" class="transition hover:bg-slate-50/70">
              <td class="px-6 py-4">
                <p class="text-xs font-semibold text-indigo-600">{{ ticket.ticketNumber }}</p>
                <div class="flex gap-2">
                  <p class="mt-1 block max-w-xs truncate text-sm font-semibold text-slate-800">
                    {{ ticket.subject }}
                  </p>
                  <span v-if="ticket.unreadCount > 0" class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"> 
                    <span class="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                    {{ ticket.unreadCount }} pesan
                  </span>
                </div>
                <p class="mt-1 max-w-xs truncate text-xs text-slate-400">{{ ticket.description }}</p>
              </td>

              <td class="px-6 py-4">
                <p class="whitespace-nowrap text-sm font-medium text-slate-700">{{ ticket.customer.name }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ ticket.customer.email }}</p>
              </td>

              <td class="px-6 py-4">
                <span class="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">{{ categoryLabel[ticket.category] }}</span>
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
          <button type="button" class="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer" :disabled="pagination.page <= 1 || isLoading" aria-label="Halaman sebelumnya" @click="changePage(pagination.page - 1)">
              <ChevronLeft class="h-4 w-4" />
          </button>

          <span class="px-2 text-sm font-medium text-slate-600">Halaman {{ pagination.page }} dari {{ totalPages }}</span>

          <button type="button" class="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer" :disabled="pagination.page >= totalPages || isLoading" aria-label="Halaman berikutnya" @click="changePage(pagination.page + 1)">
              <ChevronRight class="h-4 w-4" />
            </button>
        </div>
      </div>
    </div>
  </div>
</template>
