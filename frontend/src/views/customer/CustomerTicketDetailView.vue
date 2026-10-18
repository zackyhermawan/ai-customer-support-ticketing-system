<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, AlertCircle, Clock3, LoaderCircle, MessageSquare, RefreshCw, Send, TicketIcon, UserRound } from "lucide-vue-next";
import type { TicketDetail, TicketMessage, TicketPriority, TicketStatus } from "@/modules/tickets/type";
import { ticketDetailService } from "@/modules/tickets/ticket-detail.service";
import { connectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import { ticketsService } from "@/modules/tickets/ticket.service";

const route = useRoute();
const router = useRouter();

const ticket = ref<TicketDetail | null>(null);
const isLoading = ref(true);
const isSendingMessage = ref(false);
const messageBody = ref("");
const errorMessage = ref("");
const actionMessage = ref("");
const actionError = ref("");
const pageEndRef = ref<HTMLElement | null>(null);
const ticketId = computed(() => String(route.params.id ?? ""));
let socket: Socket | null = null;
let activeSocketTicketId = "";
const newMessagesStartId = ref<string | null>(null);

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Terbuka",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

const statusClasses: Record<TicketStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-600/20",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const priorityClasses: Record<TicketPriority, string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
};

const categoryLabels: any = {
  SHIPPING: "Pengiriman",
  PAYMENT: "Pembayaran",
  ACCOUNT: "Akun",
  TECHNICAL: "Teknis",
  PRODUCT: "Produk",
  OTHER: "Lainnya",
};

const canReply = computed(() => {
  return (ticket.value && !["RESOLVED", "CLOSED"].includes(ticket.value.status));
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRole(role: string) {
  return role === "ADMIN" ? "Admin" : "Pelanggan";
}

function showActionMessage(message: string) {
  actionMessage.value = message;
  actionError.value = "";
}

function showActionError(error: any, fallback: string) {
  actionError.value = error?.response?.data?.message ?? fallback;
  actionMessage.value = "";
}

async function loadTicket(showLoading = true) {
    if (showLoading) {
      isLoading.value = true;
    }

    errorMessage.value = "";

    try {
        ticket.value = await ticketDetailService.getDetail(ticketId.value);
        newMessagesStartId.value = ticket.value.newMessagesStartId ?? null;
        await scrollToBottom();
    } catch (error: any) {
        errorMessage.value =
            error?.response?.data?.message ??
            "Detail tiket gagal dimuat. Silakan coba lagi.";
    } finally {
        isLoading.value = false;
    }
}

async function refreshTicket() {
  actionMessage.value = "";
  actionError.value = "";
  await loadTicket();
}

async function sendMessage() {
  const body = messageBody.value.trim();
  if (!body || isSendingMessage.value) return;

  isSendingMessage.value = true;
  actionMessage.value = "";
  actionError.value = "";

  try {
    await ticketDetailService.sendMessage(ticketId.value, body);
    messageBody.value = "";
    await scrollToBottom();
    showActionMessage("Pesan berhasil dikirim kepada admin");
  } catch (error: any) {
    showActionError(error, "Pesan gagal dikirim.");
  } finally {
    isSendingMessage.value = false;
  }
}

function appendMessage(message: TicketMessage) {
    if (!ticket.value) return;

    if (message.ticketId !== ticketId.value) return;

    const alreadyExists = ticket.value.messages.some(
        (item) => item.id === message.id,
    );

    if (alreadyExists) return;

    ticket.value.messages.push(message);
    void scrollToBottom();
}

async function handleNewMessage(message: TicketMessage) {
  if (message.ticketId !== ticketId.value) return;

  appendMessage(message);

  if (message.sender.role === "CUSTOMER") return;

  try {
    await ticketsService.markAsRead(ticketId.value);
  } catch (error) {
    console.error("Gagal menandai pesan sudah dibaca:", error);
  }
}

function joinTicketRoom() {
    if (!socket || !socket.connected || !ticketId.value) return;

    if (activeSocketTicketId === ticketId.value) return;

    if (activeSocketTicketId) {
        socket.emit("ticket:leave", {
            ticketId: activeSocketTicketId,
        });
    }

    activeSocketTicketId = ticketId.value;

    socket.emit(
        "ticket:join",
        { ticketId: activeSocketTicketId },
        (response: { success: boolean; message: string }) => {
            if (!response.success) {
                console.error("Gagal bergabung ke room tiket:", response.message);
            }
        },
    );
}

function setupSocket() {
    socket = connectSocket();

    socket.on("connect", () => {
        console.log("[Socket] Connected:", socket?.id);
        joinTicketRoom();
    });

    socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error.message);
    });

    socket.on("ticket:message:new", (message) => {
        console.log("[Socket] Pesan baru diterima:", message);
        handleNewMessage(message);
    });

    if (socket.connected) {
        joinTicketRoom();
    }
}

function cleanupSocket() {
    if (!socket) return;

    socket.off("connect", joinTicketRoom);
    socket.off("ticket:message:new", appendMessage);

    if (socket.connected && activeSocketTicketId) {
        socket.emit("ticket:leave", {
            ticketId: activeSocketTicketId,
        });
    }

    activeSocketTicketId = "";
    socket = null;
}

function backToTickets() {
  router.push({ name: "customer-ticket" });
}

async function scrollConversationToBottom() {
  await nextTick();

  const container = pageEndRef.value;
  if (!container) return;

  container.scrollTop = container.scrollHeight;
}

async function scrollPageToBottom() {
  await nextTick();

  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
}

async function scrollToBottom() {
  await nextTick();

  await scrollConversationToBottom();
  await scrollPageToBottom();
}

onMounted(async () => {
    await loadTicket();

    if (ticket.value) {
        setupSocket();
        await scrollToBottom();
    }
});

watch(ticketId, async (newId, oldId) => {
    if (!newId || newId === oldId) return;

    cleanupSocket();

    await loadTicket();

    if (ticket.value) {
        setupSocket();
        await scrollToBottom();
    }
});

onBeforeUnmount(() => {
    cleanupSocket();
});
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer" @click="backToTickets">
        <ArrowLeft :size="17" />
        Kembali ke tiket saya
      </button>

      <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer" :disabled="isLoading" @click="refreshTicket">
        <RefreshCw :size="16" :class="{ 'animate-spin': isLoading }"/>
        Muat ulang
      </button>
    </div>

    <div v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <div class="flex items-center gap-2 font-semibold">
        <AlertCircle :size="18" />
        Gagal memuat tiket
      </div>

      <p class="mt-2">{{ errorMessage }}</p>

      <button type="button" class="mt-3 font-semibold underline" @click="refreshTicket">
        Coba lagi
      </button>
    </div>

    <div v-else-if="isLoading || !ticket" class="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
      <LoaderCircle :size="24" class="mx-auto mb-3 animate-spin text-indigo-600"/>
      Memuat detail tiket...
    </div>

    <template v-else>
      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div class="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-bold tracking-wide text-indigo-600">
                {{ ticket.ticketNumber }}
              </span>

              <span class="rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" :class="statusClasses[ticket.status]">
                {{ statusLabels[ticket.status] }}
              </span>
            </div>

            <h1 class="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
              {{ ticket.subject }}
            </h1>

            <p class="mt-2 text-sm leading-6 text-slate-500">
              {{ ticket.description }}
            </p>
          </div>

          <div class="flex shrink-0 flex-wrap gap-2">
            <span class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
              <TicketIcon :size="16" />
              {{ categoryLabels[ticket.category] }}
            </span>

            <span class="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold" :class="priorityClasses[ticket.priority]">
              <AlertCircle :size="16" />
              {{ priorityLabels[ticket.priority] }}
            </span>
          </div>
        </div>

        <div class="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock3 :size="18" />
            </div>

            <div>
              <p class="text-xs font-medium text-slate-500">
                Tanggal dibuat
              </p>

              <p class="mt-1 text-sm font-semibold text-slate-800">
                {{ formatDate(ticket.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 class="flex items-center gap-2 font-bold text-slate-900">
              <MessageSquare :size="18" class="text-indigo-600" />
              Percakapan
            </h2>
            <p class="mt-1 text-xs text-slate-400">{{ ticket.messages.length }} pesan dalam tiket ini</p>
          </div>
        </div>

        <div v-if="ticket.messages.length === 0" class="px-5 py-12 text-center sm:px-6">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <MessageSquare :size="22" />
          </div>
          <p class="mt-3 font-semibold text-slate-700">Belum ada percakapan</p>
          <p class="mt-1 text-sm text-slate-400">Pesan yang kamu kirim dan balasan admin akan muncul di sini.</p>
        </div>

        <div v-else ref="pageEndRef" class="max-h-[680px] space-y-5 overflow-y-auto p-5 sm:p-6">
          <template v-for="message in ticket.messages" :key="message.id">
            <div v-if="message.id === newMessagesStartId" class="flex items-center gap-3 py-1" role="separator" aria-label="Pesan baru">
              <div class="h-px flex-1 bg-indigo-200"></div>
              <span class="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">Pesan baru</span>
              <div class="h-px flex-1 bg-indigo-200"></div>
            </div>

            <div class="flex gap-3" :class="message.sender.role === 'CUSTOMER' ? 'flex-row-reverse' : 'flex-row'">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :class="message.sender.role === 'CUSTOMER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">
                <UserRound :size="17" />
              </div>

              <div class="min-w-0 max-w-[85%]">
                <div class="mb-1.5 flex flex-wrap items-center gap-2" :class="message.sender.role === 'CUSTOMER' ? 'justify-end' : 'justify-start'">
                  <span class="text-xs font-semibold text-slate-700">{{ message.sender.role === 'CUSTOMER' ? 'Kamu' : 'Admin' }}</span>
                  <span>·</span>
                  <span class="text-[11px] text-slate-400">{{ formatRole(message.sender.role) }}</span>
                </div>

                <div class="rounded-2xl px-4 py-3 text-sm leading-6" :class="message.sender.role === 'CUSTOMER' ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm bg-slate-100 text-slate-700'">
                  <p class="whitespace-pre-wrap break-words">{{ message.body }}</p>
                </div>

                <p class="mt-1.5 text-[11px] text-slate-400" :class="message.sender.role === 'CUSTOMER' ? 'text-right' : 'text-left'">
                  {{ formatDate(message.createdAt) }}
                </p>
              </div>
            </div>
          </template>
        </div>

        <div class="border-t border-slate-100 p-5 sm:p-6">
          <div v-if="canReply" class="space-y-3">
            <label for="customer-message" class="block text-sm font-semibold text-slate-800">
              Kirim pesan
            </label>

            <textarea id="customer-message" v-model="messageBody" rows="4" maxlength="5000" placeholder="Tulis pesan atau balasan kamu di sini..." class="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" :disabled="isSendingMessage"></textarea>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs text-slate-400">
                Jangan sertakan kata sandi atau informasi pembayaran yang sensitif.
              </p>

              <button type="button" class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" :disabled="!messageBody.trim() || isSendingMessage" @click="sendMessage">
                <LoaderCircle v-if="isSendingMessage" :size="16" class="animate-spin"/>
                <Send v-else :size="16" />
                {{isSendingMessage ? "Mengirim..." : "Kirim pesan"}}
              </button>
            </div>
          </div>

          <div v-else class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Tiket ini sudah {{ticket.status === "RESOLVED" ? "diselesaikan" : "ditutup"}}, sehingga kamu tidak bisa mengirim pesan baru.
          </div>
        </div>
      </section>
    </template>
  </div>
</template>