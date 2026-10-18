<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {Activity, ChevronLeft, ChevronRight, Eye, FileSearch, Filter, RefreshCw, Search, ShieldCheck, X} from "lucide-vue-next";
import { auditLogService } from "@/modules/audit-logs/audit-log.service";
import type { AuditLog, AuditLogFilters } from "@/modules/audit-logs/type";
import type { Pagination } from "@/types/type";

const logs = ref<AuditLog[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
const searchQuery = ref("");
const selectedAction = ref("");
const selectedLog = ref<AuditLog | null>(null);

const pagination = ref<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
});

const actionOptions = [
    { label: "Semua aktivitas", value: "" },
    { label: "Membuat tiket", value: "TICKET_CREATED" },
    { label: "Mengubah status", value: "TICKET_STATUS_UPDATED" },
    { label: "Mengubah prioritas", value: "TICKET_PRIORITY_UPDATED" },
    { label: "Menugaskan tiket", value: "TICKET_ASSIGNED" },
    { label: "Mengirim pesan", value: "TICKET_MESSAGE_SENT" },
    { label: "Mengirim balasan AI", value: "AI_REPLY_DRAFT_SENT" },
    { label: "Draft balasan AI dibuang", value: "AI_REPLY_DRAFT_DISCARDED" },
];

const totalPages = computed(() => pagination.value.totalPages || 1);

const filteredLogs = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return logs.value;

    return logs.value.filter((log) => {
        return [
            getActionLabel(log.action),
            log.action,
            log.actor?.name,
            log.actor?.email,
            log.ticket?.ticketNumber,
            log.ticket?.subject,
            getMetadataPreview(log.metadata),
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });
});

function getActionLabel(action: string) {
    const labels: Record<string, string> = {
        TICKET_CREATED: "Membuat tiket",
        TICKET_STATUS_UPDATED: "Mengubah status tiket",
        TICKET_PRIORITY_UPDATED: "Mengubah prioritas",
        TICKET_ASSIGNED: "Menugaskan tiket",
        TICKET_MESSAGE_SENT: "Mengirim pesan",
        AI_REPLY_DRAFT_SENT: "Mengirim balasan AI",
        AI_REPLY_DRAFT_DISCARDED: "Draft balasan AI dibuang"
    };

    return labels[action] ?? action.replaceAll("_", " ");
}

function getActionClass(action: string) {
    if (action.includes("AI")) {
        if (action.includes("DISCARDED")) {
            return "bg-rose-50 text-rose-700 border border-rose-200";
        }
        return "bg-violet-50 text-violet-700 border border-violet-200";
    }
    
    if (action.includes("CREATED")) {
        return "bg-blue-50 text-blue-700 border border-blue-200";
    }
    
    if (action.includes("SENT")) {
        return "bg-sky-50 text-sky-700 border border-sky-200";
    }
    
    if (action.includes("STATUS") || action.includes("PRIORITY") || action.includes("ASSIGNED")) {
        return "bg-amber-50 text-amber-700 border border-amber-200";
    }

    return "bg-slate-100 text-slate-700 border border-slate-200";
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getMetadataPreview(metadata: Record<string, unknown> | null) {
    if (!metadata) return "—";

    const entries = Object.entries(metadata);
    if (entries.length === 0) return "—";

    return entries.slice(0, 2).map(([key, value]) => `${key}: ${String(value)}`).join(" • ");
}

async function loadLogs() {
    isLoading.value = true;
    errorMessage.value = "";

    try {
        const filters: AuditLogFilters = {
            page: pagination.value.page,
            limit: pagination.value.limit,
        };

        if (selectedAction.value) {
            filters.action = selectedAction.value;
        }

        const result = await auditLogService.getLogs(filters);

        logs.value = result.items;
        pagination.value = result.pagination;
    } catch (error: any) {
        errorMessage.value =
            error?.response?.data?.message ??
            "Riwayat aktivitas gagal dimuat. Silakan coba lagi.";
    } finally {
        isLoading.value = false;
    }
}

function applyFilter() {
    pagination.value.page = 1;
    loadLogs();
}

function changePage(page: number) {
    if (page < 1 || page > totalPages.value || page === pagination.value.page) {
        return;
    }

    pagination.value.page = page;
    loadLogs();
}

function openLogDetail(log: AuditLog) {
    selectedLog.value = log;
}

function closeLogDetail() {
    selectedLog.value = null;
}

watch(selectedAction, () => {
    applyFilter();
});

onMounted(loadLogs);
</script>

<template>
    <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div class="flex items-center gap-2 text-sm font-medium text-indigo-600">
                    <ShieldCheck class="h-4 w-4" />
                    Monitoring sistem
                </div>
                <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900">Audit Log</h1>
                <p class="mt-1 text-sm text-slate-500">Pantau riwayat aktivitas dan perubahan yang tercatat dalam sistem.</p>
            </div>

            <button type="button" class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer" :disabled="isLoading" @click="loadLogs">
                <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
                Muat ulang
            </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500">Total aktivitas</p>
                        <p class="mt-2 text-2xl font-bold text-slate-900">{{ pagination.total.toLocaleString("id-ID") }}</p>
                    </div>
                    <div class="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <Activity class="h-5 w-5" />
                    </div>
                </div>
                <p class="mt-2 text-xs text-slate-400">Jumlah catatan aktivitas sesuai hasil API.</p>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-slate-500">Aktivitas di halaman ini</p>
                        <p class="mt-2 text-2xl font-bold text-slate-900">{{ logs.length }}</p>
                    </div>
                    <div class="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                        <FileSearch class="h-5 w-5" />
                    </div>
                </div>
                <p class="mt-2 text-xs text-slate-400">Catatan yang sedang ditampilkan.</p>
            </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-100 p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 class="font-semibold text-slate-900">Riwayat aktivitas</h2>
                        <p class="mt-1 text-sm text-slate-500">Daftar tindakan yang tercatat oleh sistem.</p>
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row">
                        <div class="relative">
                            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input v-model="searchQuery" type="text" placeholder="Cari pelaku, aksi, atau tiket..." class="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-64"/>
                        </div>

                        <div class="relative">
                            <Filter class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select v-model="selectedAction" class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-52 cursor-pointer">
                                <option v-for="option in actionOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="errorMessage" class="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{{ errorMessage }}</p>
                <button type="button" class="mt-2 font-semibold underline" @click="loadLogs">Coba lagi</button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full min-w-[850px] text-left text-sm">
                    <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th class="px-5 py-4 font-semibold">Aktivitas</th>
                            <th class="px-5 py-4 font-semibold">Pelaku</th>
                            <th class="px-5 py-4 font-semibold">Tiket terkait</th>
                            <th class="px-5 py-4 font-semibold">Waktu</th>
                            <th class="px-5 py-4 text-right font-semibold">Detail</th>
                        </tr>
                    </thead>

                    <tbody v-if="isLoading">
                        <tr>
                            <td colspan="5" class="px-5 py-16 text-center text-slate-500">
                                <RefreshCw class="mx-auto mb-3 h-6 w-6 animate-spin text-indigo-500" />
                                Memuat riwayat aktivitas...
                            </td>
                        </tr>
                    </tbody>

                    <tbody v-else-if="!errorMessage && filteredLogs.length === 0">
                        <tr>
                            <td colspan="5" class="px-5 py-16 text-center">
                                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <FileSearch class="h-6 w-6" />
                                </div>
                                <p class="mt-3 font-semibold text-slate-700">Aktivitas tidak ditemukan</p>
                                <p class="mt-1 text-sm text-slate-500">Coba ubah kata kunci atau filter aktivitas.</p>
                            </td>
                        </tr>
                    </tbody>

                    <tbody v-else class="divide-y divide-slate-100">
                        <tr v-for="log in filteredLogs" :key="log.id" class="transition hover:bg-slate-50/70">
                            <td class="px-5 py-4">
                                <span class="inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold" :class="getActionClass(log.action)">
                                    {{ getActionLabel(log.action) }}
                                </span>
                                <p class="mt-2 max-w-xs truncate text-xs text-slate-500">{{ getMetadataPreview(log.metadata) }}</p>
                            </td>

                            <td class="px-5 py-4">
                                <p class="font-medium text-slate-800">{{ log.actor?.name ?? "Pengguna tidak tersedia" }}</p>
                                <p class="mt-1 text-xs text-slate-500">{{ log.actor?.role ?? "—" }}</p>
                            </td>

                            <td class="px-5 py-4">
                                <template v-if="log.ticket">
                                    <p class="font-medium text-indigo-600">{{ log.ticket.ticketNumber }}</p>
                                    <p class="mt-1 max-w-48 truncate text-xs text-slate-500">{{ log.ticket.subject }}</p>
                                </template>
                                <span v-else class="text-slate-400">—</span>
                            </td>

                            <td class="whitespace-nowrap px-5 py-4 text-slate-600">
                                {{ formatDate(log.createdAt) }}
                            </td>

                            <td class="px-5 py-4 text-right">
                                <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer" @click="openLogDetail(log)">
                                    <Eye class="h-3.5 w-3.5" />
                                    Lihat
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-slate-500">
                    Menampilkan <span class="font-semibold text-slate-700">{{ logs.length ? (pagination.page - 1) * pagination.limit + 1 : 0 }}–{{ (pagination.page - 1) * pagination.limit + logs.length }}</span>
                    dari <span class="font-semibold text-slate-700">{{ pagination.total }}</span> Aktivitas 
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

        <div v-if="selectedLog" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" @click.self="closeLogDetail">
            <div class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div class="flex items-start justify-between border-b border-slate-100 p-5">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600">Detail audit log</p>
                        <h3 class="mt-1 text-lg font-bold text-slate-900">{{ getActionLabel(selectedLog.action) }}</h3>
                        <p class="mt-1 text-sm text-slate-500">{{ formatDate(selectedLog.createdAt) }}</p>
                    </div>
                    <button type="button" class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer" aria-label="Tutup detail" @click="closeLogDetail">
                        <X class="h-5 w-5" />
                    </button>
                </div>

                <div class="space-y-5 p-5">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="rounded-xl bg-slate-50 p-4">
                            <p class="text-xs font-medium text-slate-500">Pelaku</p>
                            <p class="mt-1 font-semibold text-slate-800">{{ selectedLog.actor?.name ?? "Pengguna tidak tersedia" }}</p>
                            <p class="mt-1 text-sm text-slate-500">{{ selectedLog.actor?.role ?? "—" }}</p>
                        </div>
                        <div class="rounded-xl bg-slate-50 p-4">
                            <p class="text-xs font-medium text-slate-500">ID aktivitas</p>
                            <p class="mt-1 break-all font-mono text-xs text-slate-700">{{ selectedLog.id }}</p>
                        </div>
                    </div>

                    <div v-if="selectedLog.ticket">
                        <p class="mb-2 text-sm font-semibold text-slate-700">Tiket terkait</p>
                        <div class="rounded-xl border border-slate-200 p-4">
                            <p class="font-semibold text-indigo-600">{{ selectedLog.ticket.ticketNumber }}</p>
                            <p class="mt-1 text-sm text-slate-600">{{ selectedLog.ticket.subject }}</p>
                        </div>
                    </div>

                    <div>
                        <p class="mb-2 text-sm font-semibold text-slate-700">Metadata aktivitas</p>
                        <pre class="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{{ JSON.stringify(selectedLog.metadata ?? {}, null, 2) }}</pre>
                    </div>

                    <div class="rounded-xl border border-slate-200 p-4">
                        <p class="text-xs font-medium text-slate-500">Waktu aktivitas</p>
                        <p class="mt-1 text-sm font-semibold text-slate-800">{{ formatDate(selectedLog.createdAt) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
