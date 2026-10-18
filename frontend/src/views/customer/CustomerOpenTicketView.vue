<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { LoaderCircle, Send, Ticket } from "lucide-vue-next";
import type { CreateCustomerTicketPayload } from "@/modules/tickets/type";
import { ticketsService } from "@/modules/tickets/ticket.service";

const router = useRouter();

const form = reactive<CreateCustomerTicketPayload>({
    subject: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
});

const isSubmitting = ref(false);
const errorMessage = ref("");
const fieldErrors = ref<Record<string, string>>({});

const categories = [
    { label: "Pembayaran", value: "PAYMENT" },
    { label: "Pengiriman", value: "SHIPPING" },
    { label: "Produk", value: "PRODUCT" },
    { label: "Teknis", value: "TECHNICAL" },
    { label: "Lainnya", value: "OTHER" },
];

const priorities = [
    { label: "Rendah", value: "LOW" },
    { label: "Sedang", value: "MEDIUM" },
    { label: "Tinggi", value: "HIGH" },
    { label: "Urgent", value: "URGENT" },
];

function clearFieldError(field: string) {
    delete fieldErrors.value[field];
    errorMessage.value = "";
}

async function submitTicket() {
    if (isSubmitting.value) return;

    errorMessage.value = "";
    fieldErrors.value = {};

    if (!form.subject.trim()) {
        fieldErrors.value.subject = "Subjek tiket wajib diisi.";
    }

    if (!form.description.trim()) {
        fieldErrors.value.description = "Deskripsi masalah wajib diisi.";
    }

    if (Object.keys(fieldErrors.value).length > 0) return;

    isSubmitting.value = true;

    try {
        const ticket = await ticketsService.create({
            subject: form.subject.trim(),
            description: form.description.trim(),
            category: form.category,
            priority: form.priority,
        });

        await router.push({
            name: "customer-ticket-detail",
            params: { id: ticket.id },
        });
    } catch (error: any) {
        const response = error?.response?.data;
        const details = response?.errors ?? response?.data?.errors;

        if (Array.isArray(details)) {
            for (const detail of details) {
                if (detail.path?.[0]) {
                    fieldErrors.value[String(detail.path[0])] = detail.message;
                }
            }
        }

        errorMessage.value = response?.message ?? "Tiket gagal dibuat. Silakan coba lagi.";
    } finally {
        isSubmitting.value = false;
    }
}

function backToTickets() {
    router.push({ name: "customer-tickets" });
}
</script>

<template>
    <div class="mx-auto max-w-4xl space-y-6">
        <div>
            <div>
                <h1 class="text-2xl font-bold tracking-tight text-slate-900">Open Ticket</h1>
                <p class="mt-1 text-sm text-slate-500">Sampaikan kendala Anda agar tim support dapat membantu.</p>
            </div>
        </div>

        <form class="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" @submit.prevent="submitTicket">
            <div class="flex items-start gap-3 rounded-xl bg-indigo-50 p-4">
                <Ticket class="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <div>
                    <p class="text-sm font-semibold text-indigo-900">Buat tiket bantuan baru</p>
                    <p class="mt-1 text-sm leading-5 text-indigo-700">Jelaskan kendala secara detail supaya tim support dapat memahami masalah Anda.</p>
                </div>
            </div>

            <div>
                <label for="subject" class="mb-2 block text-sm font-semibold text-slate-700">Subjek tiket</label>
                <input id="subject" v-model="form.subject" type="text" maxlength="150" placeholder="Contoh: Pesanan belum diterima" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500/10': fieldErrors.subject }" @input="clearFieldError('subject')"/>
                <p v-if="fieldErrors.subject" class="mt-1.5 text-sm text-red-600">{{ fieldErrors.subject }}</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
                <div>
                    <label for="category" class="mb-2 block text-sm font-semibold text-slate-700">Kategori masalah</label>
                    <select id="category" v-model="form.category" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                        <option v-for="category in categories" :key="category.value" :value="category.value">
                            {{ category.label }}
                        </option>
                    </select>
                </div>

                <div>
                    <label for="priority" class="mb-2 block text-sm font-semibold text-slate-700">Prioritas</label>
                    <select id="priority" v-model="form.priority" class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                        <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
                            {{ priority.label }}
                        </option>
                    </select>
                </div>
            </div>

            <div>
                <label for="description" class="mb-2 block text-sm font-semibold text-slate-700">Deskripsi masalah</label>
                <textarea id="description" v-model="form.description" rows="6" maxlength="5000" placeholder="Ceritakan kendala yang Anda alami secara detail..." class="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-500/10': fieldErrors.description }" @input="clearFieldError('description')"/>
                <div class="mt-1.5 flex items-start justify-between gap-3">
                    <p v-if="fieldErrors.description" class="text-sm text-red-600">{{ fieldErrors.description }}</p>
                    <p v-else class="text-sm text-slate-400">Jangan sertakan kata sandi atau informasi rahasia.</p>
                    <span class="shrink-0 text-xs text-slate-400">{{ form.description.length }}/5000</span>
                </div>
            </div>

            <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ errorMessage }}
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" class="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer" :disabled="isSubmitting" @click="backToTickets">
                    Batal
                </button>
                <button type="submit" :disabled="isSubmitting" class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
                    <LoaderCircle v-if="isSubmitting" class="h-4 w-4 animate-spin" />
                    <Send v-else class="h-4 w-4" />
                    {{ isSubmitting ? "Membuat tiket..." : "Buat tiket" }}
                </button>
            </div>
        </form>
    </div>
</template>
