
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Bot, CheckCircle2, Clock3, Copy, FileText, LoaderCircle, MessageSquare, RefreshCw, Send, Sparkles, Trash2, UserRound, AlertCircle } from "lucide-vue-next";
import { ticketDetailService } from "@/modules/tickets/ticket-detail.service";
import type { AIReplyDraft, TicketAIAnalysis, TicketCategory, TicketDetail, TicketPriority, TicketStatus } from "@/modules/tickets/type";
import { connectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import { ticketsService } from "@/modules/tickets/ticket.service";

const route = useRoute();
const router = useRouter();
const ticket = ref<TicketDetail | null>(null);
const analyses = ref<TicketAIAnalysis[]>([]);
const drafts = ref<AIReplyDraft[]>([]);
const isLoading = ref(true);
const isGenerating = ref(false);
const isSendingMessage = ref(false);
const manualMessage = ref("");
const isRefreshingAI = ref(false);
const busyDraftId = ref("");
const errorMessage = ref("");
const actionMessage = ref("");
const actionError = ref("");
const actionMessageDraft = ref("");
const actionErrorDraft = ref("");
const pageEndRef = ref<HTMLElement | null>(null);
const conversationSectionRef = ref<HTMLElement | null>(null);
const ticketId = computed(() => String(route.params.id ?? ""));
type TicketMessage = NonNullable<TicketDetail["messages"]>[number];
let socket: Socket | null = null;
let activeSocketTicketId = "";
const newMessagesStartId = ref<string | null>(null);
const latestAnalysis = computed(() => analyses.value[0] ?? null);

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
    OTHER: "Lainnya"
};

const statusClasses: Record<TicketStatus, string> = {
    OPEN: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-emerald-50 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-600",
};

const sentimentLabels: Record<string, string> = {
    ANGRY: "Marah",
    FRUSTRATED: "Kecewa",
    NEGATIVE: "Negatif",
    NEUTRAL: "Netral",
    POSITIVE: "Positif",
    SATISFIED: "Puas",
};

function formatDate(value: string | null) {
  if (!value) return "Belum tersedia";
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
  actionError.value = error.response?.data?.message ?? fallback;
  actionMessage.value = "";
}

function showActionMessageDraft(message: string) {
  actionMessageDraft.value = message;
  actionErrorDraft.value = "";
}

function showActionErrorDraft(error: any, fallback: string) {
  actionErrorDraft.value = error.response?.data?.message ?? fallback;
  actionMessageDraft.value = "";
}

async function loadTicket(showLoading = true) {
  if (showLoading) {
    isLoading.value = true;
  }
  errorMessage.value = "";
  actionMessage.value = "";
  actionError.value = "";
  actionMessageDraft.value = "";
  actionErrorDraft.value = "";

  try {
    ticket.value = await ticketDetailService.getDetail(ticketId.value);
    newMessagesStartId.value = ticket.value.newMessagesStartId ?? null;
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message ?? "Detail tiket gagal dimuat.";
  } finally {
    if (showLoading) {
      isLoading.value = false;
    }
  }
}

async function loadAIData() {
  isRefreshingAI.value = true;

  try {
    const results = await Promise.allSettled([
      ticketDetailService.getAnalysis(ticketId.value),
      ticketDetailService.getDrafts(ticketId.value),
    ]);

    if (results[0].status === "fulfilled") analyses.value = results[0].value;
    if (results[1].status === "fulfilled") drafts.value = results[1].value;

    const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    
    if (failures.length > 0) {
      const firstError = failures[0]?.reason ?? null;
      showActionError(firstError, "Sebagian data AI gagal dimuat.");
    }
  } catch (error: any) {
    showActionError(error, "Gagal memuat data AI.");
  } finally {
    isRefreshingAI.value = false;
  }
}

async function refreshAll() {
  await loadTicket();
  if (ticket.value) await loadAIData();
}

async function generateDraft() {
  isGenerating.value = true;
  actionMessage.value = "";
  actionError.value = "";

  try {
    const draft = await ticketDetailService.generateDraft(ticketId.value);
    drafts.value = [draft, ...drafts.value.filter((item) => item.id !== draft.id)];
    showActionMessageDraft("Draf balasan AI berhasil dibuat.");
  } catch (error: any) {
    showActionErrorDraft(error, "Draf balasan AI gagal dibuat.");
  } finally {
    isGenerating.value = false;
  }
}

async function sendDraft(draft: AIReplyDraft) {
  if (!window.confirm("Kirim draf balasan ini kepada pelanggan?")) return;
  busyDraftId.value = draft.id;
  actionMessage.value = "";
  actionError.value = "";

  try {
    await ticketDetailService.sendDraft(ticketId.value, draft.id);
    drafts.value = drafts.value.map((item) => item.id === draft.id ? { ...item, status: "SENT", sentAt: new Date().toISOString() } : item);
    await scrollToBottom();
    showActionMessage("Balasan berhasil dikirim kepada pelanggan.");
  } catch (error: any) {
    showActionError(error, "Balasan gagal dikirim.");
  } finally {
    busyDraftId.value = "";
  }
}

async function sendManualMessage() {
    const body = manualMessage.value.trim();

    if (!body || isSendingMessage.value) return;

    isSendingMessage.value = true;
    actionMessage.value = "";
    actionError.value = "";

    try {
        await ticketDetailService.sendMessage(ticketId.value, body);

        manualMessage.value = "";
        await scrollToBottom();
    } catch (error: any) {
        showActionError(error, "Pesan gagal dikirim.");
    } finally {
        isSendingMessage.value = false;
    }
}

async function discardDraft(draft: AIReplyDraft) {
  if (!window.confirm("Buang draf balasan ini?")) return;
  busyDraftId.value = draft.id;
  actionMessage.value = "";
  actionError.value = "";

  try {
    await ticketDetailService.discardDraft(ticketId.value, draft.id);
    drafts.value = drafts.value.map((item) => item.id === draft.id ? { ...item, status: "DISCARDED" } : item);
    showActionMessage("Draf balasan berhasil dibuang.");
  } catch (error: any) {
    showActionError(error, "Draf balasan gagal dibuang.");
  } finally {
    busyDraftId.value = "";
  }
}

async function copyDraft(content: string) {
  try {
    await navigator.clipboard.writeText(content);
    showActionMessageDraft("Isi draf berhasil disalin.");
  } catch {
    showActionErrorDraft(null, "Isi draf gagal disalin ke papan klip.");
  }
}

async function changeStatus(event: Event) {
  if (!ticket.value) return;
  const selectElement = event.target as HTMLSelectElement;
  const nextStatus = selectElement.value as TicketStatus;
  const previousStatus = ticket.value.status;
  
  ticket.value.status = nextStatus;

  try {
    await ticketDetailService.updateStatus(ticketId.value, nextStatus);
    showActionMessage("Status tiket berhasil diperbarui.");
  } catch (error: any) {
    ticket.value.status = previousStatus;
    selectElement.value = previousStatus;
    showActionError(error, "Status tiket gagal diperbarui.");
  }
}

async function changePriority(event: Event) {
  if (!ticket.value) return;
  const selectElement = event.target as HTMLSelectElement;
  const nextPriority = selectElement.value as TicketPriority;
  const previousPriority = ticket.value.priority;
  
  ticket.value.priority = nextPriority;

  try {
    await ticketDetailService.updatePriority(ticketId.value, nextPriority);
    showActionMessage("Prioritas tiket berhasil diperbarui.");
  } catch (error: any) {
    ticket.value.priority = previousPriority;
    selectElement.value = previousPriority;
    showActionError(error, "Prioritas tiket gagal diperbarui.");
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

  if (message.sender.role === "ADMIN") return;

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

async function scrollToBottom() {
  await nextTick();

  const container = pageEndRef.value;
  if (!container) return;

  container.scrollTop = container.scrollHeight;
}

async function scrollPageToConversationBottom() {
  await nextTick();

  conversationSectionRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "end",
    inline: "nearest",
  });
}

onMounted(async () => {
  await loadTicket();

  if (ticket.value) {
    await loadAIData();
    setupSocket();
    await scrollToBottom();
    await scrollPageToConversationBottom();
  }
});

watch(ticketId, async (newId, oldId) => {
  if (!newId || newId === oldId) return;

  cleanupSocket();
  await loadTicket();

  if (ticket.value) {
    await loadAIData();
    setupSocket();
    await scrollToBottom();
    await scrollPageToConversationBottom();
  }
});

onBeforeUnmount(() => {
    cleanupSocket();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer" @click="router.push({ name: 'admin-tickets' })">
        <ArrowLeft :size="17" />
        Kembali ke daftar tiket
      </button>

      <button type="button" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer" :disabled="isLoading || isRefreshingAI" @click="refreshAll">
        <RefreshCw :size="16" :class="{ 'animate-spin': isLoading || isRefreshingAI }" />
        Muat ulang
      </button>
    </div>

    <div v-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <div class="flex items-center gap-2 font-semibold"><AlertCircle :size="18" /> Gagal memuat tiket</div>
      <p class="mt-2">{{ errorMessage }}</p>
      <button type="button" class="mt-3 font-semibold underline" @click="refreshAll">Coba lagi</button>
    </div>

    <div v-else-if="isLoading || !ticket" class="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
      <LoaderCircle :size="24" class="mx-auto mb-3 animate-spin text-indigo-600" />
      Memuat detail tiket...
    </div>

    <template v-else>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div class="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{{ ticket.ticketNumber }}</span>
              <span class="rounded-full px-3 py-1.5 text-xs font-semibold" :class="statusClasses[ticket.status]">{{ statusLabels[ticket.status] }}</span>
            </div>
            <h1 class="mt-4 text-2xl font-bold tracking-tight text-slate-900">{{ ticket.subject }}</h1>
            <p class="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-500">{{ ticket.description }}</p>
            <p class="mt-4 flex items-center gap-2 text-xs text-slate-400"><Clock3 :size="14" /> Dibuat {{ formatDate(ticket.createdAt) }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:min-w-64 lg:grid-cols-1">
            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-slate-500">Status tiket</span>
              <select :value="ticket.status" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 cursor-pointer" @change="changeStatus">
                <option value="OPEN">Terbuka</option>
                <option value="IN_PROGRESS">Diproses</option>
                <option value="RESOLVED">Selesai</option>
                <option value="CLOSED">Ditutup</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-slate-500">Prioritas</span>
              <select :value="ticket.priority" class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 cursor-pointer" @change="changePriority">
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak</option>
              </select>
            </label>
          </div>
        </div>

        <div class="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p class="text-xs font-medium text-slate-400">Pelanggan</p>
            <p class="mt-1.5 text-sm font-semibold text-slate-800">{{ ticket.customer.name }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ ticket.customer.email }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-400">Kategori</p>
            <p class="mt-1.5 text-sm font-semibold text-slate-800">{{ categoryLabels[ticket.category] }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-400">Pembaruan terakhir</p>
            <p class="mt-1.5 text-sm font-semibold text-slate-800">{{ formatDate(ticket.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <div class="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section ref="conversationSectionRef" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 class="flex items-center gap-2 font-bold text-slate-900"><MessageSquare :size="19" class="text-indigo-600" /> Percakapan</h2>
              <p class="mt-1 text-xs text-slate-400">{{ ticket.messages.length }} pesan dalam tiket ini</p>
            </div>
          </div>

          <div v-if="ticket.messages.length === 0" class="p-10 text-center text-sm text-slate-400">Belum ada percakapan.</div>

          <div v-else ref="pageEndRef" class="max-h-[680px] space-y-5 overflow-y-auto p-5 sm:p-6">
            <template v-for="message in ticket.messages" :key="message.id">
              <div v-if="message.id === newMessagesStartId" class="flex items-center gap-3 py-1" role="separator" aria-label="Pesan baru">
                <div class="h-px flex-1 bg-indigo-200"></div>
                <span class="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  Pesan baru
                </span>
                <div class="h-px flex-1 bg-indigo-200"></div>
              </div>

              <div class="flex gap-3" :class="message.sender.role === 'ADMIN' ? 'flex-row-reverse' : 'flex-row'">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :class="message.sender.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'">
                  <UserRound :size="17" />
                </div>

                <div class="min-w-0 max-w-[85%]">
                  <div class="mb-1.5 flex flex-wrap items-center gap-2" :class="message.sender.role === 'ADMIN' ? 'justify-end' : 'justify-start'">
                    <span class="text-xs font-semibold text-slate-700">
                      {{ message.sender.name }}
                    </span>

                    <span>·</span>

                    <span class="text-[11px] text-slate-400">
                      {{ formatRole(message.sender.role) }}
                    </span>
                  </div>

                  <div class="rounded-2xl px-4 py-3 text-sm leading-6" :class="message.sender.role === 'ADMIN' ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm bg-slate-100 text-slate-700'">
                    <p class="whitespace-pre-wrap break-words">
                      {{ message.body }}
                    </p>
                  </div>

                  <p class="mt-1.5 text-[11px] text-slate-400" :class="message.sender.role === 'ADMIN' ? 'text-right' : 'text-left'">
                    {{ formatDate(message.createdAt) }}
                  </p>
                </div>
              </div>
            </template>
          </div>

          <form class="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6" @submit.prevent="sendManualMessage">
            <label for="manual-message" class="mb-2 block text-sm font-semibold text-slate-700">Kirim pesan</label>
            <textarea id="manual-message" v-model="manualMessage" rows="4" maxlength="5000" placeholder="Ketik balasan untuk pelanggan..." class="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-100" :disabled="isSendingMessage"></textarea>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p class="text-xs text-slate-400">Pesan ini akan terlihat oleh pelanggan.</p>
              <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" :disabled="!manualMessage.trim() || isSendingMessage">
                <LoaderCircle v-if="isSendingMessage" :size="16" class="animate-spin" />
                <Send v-else :size="16" />
                {{ isSendingMessage ? "Mengirim..." : "Kirim pesan" }}
              </button>
            </div>
          </form>
        </section>

        <div class="space-y-6">
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 class="flex items-center gap-2 font-bold text-slate-900">
                    <Sparkles :size="19" class="text-violet-600" /> 
                    Analisis AI
                </h2>
                <p class="mt-1 text-xs text-slate-400">Hasil analisis otomatis untuk tiket ini</p>
              </div>
              <button type="button" class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer" aria-label="Muat ulang analisis AI" :disabled="isRefreshingAI" @click="loadAIData"><RefreshCw :size="16" :class="{ 'animate-spin': isRefreshingAI }" /></button>
            </div>

            <div v-if="!latestAnalysis" class="p-6 text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Bot :size="22" /></div>
              <p class="mt-3 text-sm font-semibold text-slate-700">Analisis belum tersedia</p>
              <p class="mt-1 text-xs leading-5 text-slate-400">Analisis akan muncul setelah proses AI selesai dijalankan pada backend.</p>
            </div>

            <div v-else class="space-y-5 p-5 sm:p-6">
              <div class="flex items-center justify-between gap-3">
                <span class="text-xs font-medium text-slate-500">Status analisis</span>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="latestAnalysis.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : latestAnalysis.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'">{{ latestAnalysis.status === "COMPLETED" ? "Selesai" : latestAnalysis.status === "FAILED" ? "Gagal" : latestAnalysis.status === "PROCESSING" ? "Sedang diproses" : "Menunggu" }}</span>
              </div>

              <div v-if="latestAnalysis.status === 'COMPLETED'" class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-xs text-slate-400">Sentimen</p>
                  <p class="mt-1.5 text-sm font-bold text-slate-800">{{ latestAnalysis.sentiment ? sentimentLabels[latestAnalysis.sentiment] ?? latestAnalysis.sentiment : "—" }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-xs text-slate-400">Keyakinan AI</p>
                  <p class="mt-1.5 text-sm font-bold text-slate-800">{{ latestAnalysis.confidence == null ? "—" : `${Math.round(latestAnalysis.confidence * 100)}%` }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-xs text-slate-400">Saran prioritas</p>
                  <p class="mt-1.5 text-sm font-bold text-slate-800">{{ latestAnalysis.suggestedPriority ? priorityLabels[latestAnalysis.suggestedPriority] : "—" }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-xs text-slate-400">Saran kategori</p>
                  <p class="mt-1.5 text-sm font-bold text-slate-800">{{ latestAnalysis.suggestedCategory ? categoryLabels[latestAnalysis.suggestedCategory] : "-" }}</p>
                </div>
              </div>

              <div v-if="latestAnalysis.summary">
                <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Ringkasan</h3>
                <p class="whitespace-pre-line text-sm leading-6 text-slate-600">{{ latestAnalysis.summary }}</p>
              </div>

              <div v-if="latestAnalysis.reason">
                <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Alasan analisis</h3>
                <p class="whitespace-pre-line text-sm leading-6 text-slate-600">{{ latestAnalysis.reason }}</p>
              </div>

              <div v-if="latestAnalysis.status === 'FAILED'" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ latestAnalysis.errorMessage ?? "Proses analisis AI gagal." }}</div>
              <p class="border-t border-slate-100 pt-4 text-[11px] text-slate-400">Dianalisis {{ formatDate(latestAnalysis.completedAt ?? latestAnalysis.createdAt) }}</p>
            </div>
          </section>

          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 class="flex items-center gap-2 font-bold text-slate-900"><FileText :size="19" class="text-indigo-600" /> Draf balasan AI</h2>
                <p class="mt-1 text-xs text-slate-400">Periksa draf sebelum mengirimnya kepada pelanggan.</p>
              </div>
              
              <button type="button" class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer" :disabled="isGenerating" @click="generateDraft">
                <LoaderCircle v-if="isGenerating" :size="15" class="animate-spin" />
                <Sparkles v-else :size="15" />
                Buat draf
              </button>
            </div>

            <div class="px-8 pt-6">
              <div v-if="actionMessageDraft" class="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 :size="18" class="shrink-0" />
                  <p>{{ actionMessageDraft }}</p>
              </div>
  
              <div v-if="actionErrorDraft" class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle :size="18" class="shrink-0" />
                  <p>{{ actionErrorDraft }}</p>
              </div>
            </div>

            <div v-if="drafts.length === 0" class="p-8 text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FileText :size="22" /></div>
              <p class="mt-3 text-sm font-semibold text-slate-700">Belum ada draf balasan</p>
              <p class="mt-1 text-xs leading-5 text-slate-400">Klik tombol Buat draf untuk menghasilkan usulan balasan dari AI.</p>
            </div>

            <div v-else class="space-y-4 p-5 sm:p-6">
              <div v-for="draft in drafts" :key="draft.id" class="rounded-xl border border-slate-200 p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="draft.status === 'DRAFT' ? 'bg-indigo-50 text-indigo-700' : draft.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ draft.status === "DRAFT" ? "Draf" : draft.status === "SENT" ? "Terkirim" : "Dibuang" }}</span>
                  <span class="text-[11px] text-slate-400">{{ formatDate(draft.createdAt) }}</span>
                </div>

                <p class="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{{ draft.content }}</p>

                <div class="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer" @click="copyDraft(draft.content)"><Copy :size="14" /> Salin</button>
                  <button v-if="draft.status === 'DRAFT'" type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 cursor-pointer" :disabled="busyDraftId === draft.id" @click="sendDraft(draft)"><LoaderCircle v-if="busyDraftId === draft.id" :size="14" class="animate-spin" /><Send v-else :size="14" /> Kirim balasan</button>
                  <button v-if="draft.status === 'DRAFT'" type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 cursor-pointer" :disabled="busyDraftId === draft.id" @click="discardDraft(draft)"><Trash2 :size="14" /> Buang draf</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
