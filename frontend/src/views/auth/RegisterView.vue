<script setup lang="ts">
import { reactive, ref } from "vue";
import axios from "axios";
import type { RegisterCredentials } from "@/modules/auth/type";
import { authService } from "@/modules/auth/auth.service";
import { AlertCircle, CheckCircle2 } from "lucide-vue-next";

const form = reactive<RegisterCredentials>({
  name: "",
  email: "",
  password: ""
});

const isSubmitting = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

async function handleRegister() {
  if (isSubmitting.value) return;

  isSubmitting.value = true
  successMessage.value = "";
  errorMessage.value = "";

  try {
    await authService.register({
      name: form.name,
      email: form.email.trim(),
      password: form.password,
    });
    
    form.name = ""
    form.email = ""
    form.password = ""

    successMessage.value = "Akun berhasil dibuat"
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? "Register gagal. Periksa koneksi ke server.";
    } else {
      errorMessage.value = "Terjadi kesalahan. Silakan coba lagi.";
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-800">
    <section class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-slate-100 text-xl font-bold shadow-lg shadow-indigo-500/20">
          AI
        </div>

        <h1 class="text-3xl font-bold tracking-tight">
          Buat Akun Anda
        </h1>

        <p class="mt-2 text-sm text-slate-400">
          Daftar untuk mulai membuat dan melacak tiket bantuan Anda
        </p>
      </div>

      <form class="space-y-5 rounded-2xl border border-slate-100 p-6 shadow-2xl sm:p-8" @submit.prevent="handleRegister">
        <div v-if="successMessage" class="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 :size="18" class="shrink-0" />
            <p>{{ successMessage }}</p>
        </div>

        <div v-if="errorMessage" class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle :size="18" class="shrink-0" />
            <p>{{ errorMessage }}</p>
        </div>

        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium">
            Nama
          </label>

          <input v-model="form.name" type="text" placeholder="Masukkan nama anda" required class="w-full rounded-lg border border-slate-200/75 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"/>
        </div>

        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium">
            Alamat Email
          </label>

          <input v-model="form.email" type="email" placeholder="you@example.com" required class="w-full rounded-lg border border-slate-200/75 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium">
            Kata Sandi
          </label>

          <input v-model="form.password" type="password" placeholder="Masukkan kata sandi anda" required class="w-full rounded-lg border border-slate-200/75 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"/>
        </div>

        <button type="submit" :disabled="isSubmitting" class="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
          {{ isSubmitting ? "Memuat..." : "Daftar" }}
        </button>

          <p class="text-sm flex gap-2">Sudah punya akun? <RouterLink :to="{ name: 'login' }" class="text-indigo-700 underline">Masuk</RouterLink> </p>
      </form>
    </section>
  </main>
</template>
