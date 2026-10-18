<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {Ticket, Clock3, CheckCircle2, CircleAlert, RefreshCw, Sparkles} from "lucide-vue-next";
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, ArcElement} from "chart.js";
import { Line, Doughnut, Bar } from "vue-chartjs";
import { analyticsService } from "@/modules/analytics/analytic.service";
import type { AnalyticsOverview } from "@/modules/analytics/type";
import type { TicketPriority, TicketStatus } from "@/modules/tickets/type";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
);

const data = ref<AnalyticsOverview | null>(null);
const loading = ref(true);
const errorMessage = ref("");

const numberFormatter = new Intl.NumberFormat("id-ID");

const averageResolution = computed(() => {
    const seconds = data.value?.averageResolutionSeconds;

    if (seconds == null) return "—";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
});

const trendChart = computed(() => ({
    labels: data.value?.ticketTrend.map((item) => new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        }),
    ) ?? [],
    datasets: [
        {
            label: "Tickets",
            data: data.value?.ticketTrend.map((item) => item.total) ?? [],
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.10)",
            fill: true,
            tension: 0.38,
            pointRadius: 3,
            pointHoverRadius: 5,
        },
    ],
}));

const statusChart = computed(() => ({
    labels: data.value?.byStatus.map((item) => statusLabels[item.status].replaceAll("_", " ")) ?? [],
    datasets: [
        {
            data: data.value?.byStatus.map((item) => item.total) ?? [],
            backgroundColor: ["#818cf8", "#38bdf8", "#fbbf24", "#34d399", "#94a3b8"],
            borderWidth: 0,
            hoverOffset: 5,
        },
    ],
}));

const categoryChart = computed(() => ({
    labels: data.value?.byCategory.map((item) => item.category) ?? [],
    datasets: [
        {
            label: "Tickets",
            data: data.value?.byCategory.map((item) => item.total) ?? [],
            backgroundColor: "#818cf8",
            borderRadius: 6,
            maxBarThickness: 28,
        },
    ],
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
    },
    scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "#f1f5f9" },
            border: { display: false, dash: [4, 4] },
        },
    },
};

const lineOptions = {
    ...chartOptions,
    scales: {
            ...chartOptions.scales,
        y: {
            ...chartOptions.scales.y,
            grid: { color: "#f1f5f9" },
        },
    },
};

const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
        legend: {
            display: true,
            position: "bottom" as const,
            labels: {
                usePointStyle: true,
                pointStyle: "circle" as const,
                padding: 18,
                boxWidth: 8,
                font: { size: 11 },
            },
        },
    },
};

async function loadDashboard() {
    loading.value = true;
    errorMessage.value = "";

    try {
        data.value = await analyticsService.getOverview();
    } catch {
        errorMessage.value = "Gagal memuat analytics. Coba muat ulang data.";
    } finally {
        loading.value = false;
    }
}

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Terbuka",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

const sentimentLabels: any = {
    ANGRY: "Marah",
    FRUSTRATED: "Frustasi",
    NEUTRAL: "Netral",
    SATISFIED: "Puas"
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

onMounted(loadDashboard);
</script>

<template>
    <div class="space-y-8">
        <section class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <div class="flex items-center gap-2 text-sm font-medium text-indigo-600">
                    <Sparkles :size="16" />
                    Dukungan AI
                </div>
                <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Ringkasan
                </h2>
                <p class="mt-2 text-sm text-slate-500">
                    Berikut adalah informasi terkini mengenai tiket.
                </p>
            </div>

            <button class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer" :disabled="loading" @click="loadDashboard">
                <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
                Muat ulang
            </button>
        </section>

        <div v-if="errorMessage" role="alert" class="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ errorMessage }}
            <button class="font-semibold underline" @click="loadDashboard">
                Retry
            </button>
        </div>

        <div v-if="loading && !data" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="item in 4" :key="item" class="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"/>
        </div>

        <template v-else-if="data">
            <section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                    <div class="flex items-center justify-between">
                        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Ticket :size="21" />
                        </div>
                        <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            Semua waktu
                        </span>
                    </div>
                    <p class="mt-5 text-sm text-slate-500">Total tiket</p>
                    <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {{ numberFormatter.format(data.summary.totalTickets) }}
                    </p>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                    <div class="flex items-center justify-between">
                        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <CircleAlert :size="21" />
                        </div>
                        <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Aktif
                        </span>
                    </div>
                    <p class="mt-5 text-sm text-slate-500">Tiket terbuka</p>
                    <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {{ numberFormatter.format(data.summary.openTickets) }}
                    </p>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                    <div class="flex items-center justify-between">
                        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 :size="21" />
                        </div>
                        <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Selesai
                        </span>
                    </div>
                    <p class="mt-5 text-sm text-slate-500">Tiket selesai</p>
                    <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {{ numberFormatter.format(data.summary.resolvedTickets + data.summary.closedTickets) }}
                    </p>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                        <Clock3 :size="21" />
                    </div>
                    <p class="mt-5 text-sm text-slate-500">Rata-rata waktu penyelesaian</p>
                    <p class="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {{ averageResolution }}
                    </p>
                    <p class="mt-1 text-xs text-slate-400">Dari tiket yang telah selesai</p>
                </article>
            </section>

            <section class="grid gap-5 xl:grid-cols-3">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h3 class="font-bold text-slate-900">Volume Tiket</h3>
                            <p class="mt-1 text-sm text-slate-500">
                                Pembuatan tiket selama 7 hari terakhir
                            </p>
                        </div>
                        <span class="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                            7 hari terakhir
                        </span>
                    </div>

                    <div class="mt-6 h-72">
                        <Line :data="trendChart" :options="lineOptions" />
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 class="font-bold text-slate-900">Status tiket</h3>
                    <p class="mt-1 text-sm text-slate-500">Distribusikan saat ini</p>

                    <div class="mt-5 h-64">
                        <Doughnut :data="statusChart" :options="doughnutOptions" />
                    </div>
                </article>
            </section>

            <section class="grid gap-5 xl:grid-cols-2">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 class="font-bold text-slate-900">Tiket berdasarkan kategori</h3>
                    <p class="mt-1 text-sm text-slate-500">
                        Memahami keluhan pelanggan yang paling sering terjadi
                    </p>

                    <div class="mt-6 h-72">
                        <Bar :data="categoryChart" :options="chartOptions"/>
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 class="font-bold text-slate-900">Sentimen AI</h3>
                    <p class="mt-1 text-sm text-slate-500">
                        Sentimen dari hasil analisis AI terbaru per tiket
                    </p>

                    <div v-if="data.bySentiment.length" class="mt-6 space-y-5">
                        <div v-for="item in data.bySentiment" :key="item.sentiment">
                            <div class="mb-2 flex items-center justify-between text-sm">
                                <span class="font-medium text-slate-700">
                                    {{ sentimentLabels[item.sentiment] }}
                                </span>
                                <span class="font-semibold text-slate-900">
                                    {{ numberFormatter.format(item.total) }}
                                </span>
                            </div>

                            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-indigo-500 transition-all" :style="{
                                    width: `${
                                        data.bySentiment.reduce((sum, entry) => sum + entry.total, 0)
                                            ? (item.total / data.bySentiment.reduce((sum, entry) => sum + entry.total, 0)) * 100
                                            : 0
                                        }%`,
                                    }"
                                />
                            </div>
                        </div>
                    </div>

                    <div v-else class="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Belum ada data analisis AI.
                    </div>
                </article>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div class="mb-5">
                    <h3 class="font-bold text-slate-900">Prioritas Tiket</h3>
                    <p class="mt-1 text-sm text-slate-500">
                        Distribusikan prioritas tiket saat ini
                    </p>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div v-for="item in data.byPriority" :key="item.priority" class="rounded-xl bg-slate-50 p-4">
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {{ priorityLabels[item.priority] }}
                        </p>
                        <p class="mt-2 text-2xl font-bold text-slate-900">
                            {{ numberFormatter.format(item.total) }}
                        </p>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>
