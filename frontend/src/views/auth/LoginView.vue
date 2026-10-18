<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../../modules/auth/auth.store";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";

  try {
    const user = await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });

    await router.replace(user.role === "ADMIN" ? "/admin" : "/customer");
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      errorMessage.value =
        error.response?.data?.message ??
        "Login gagal. Periksa koneksi ke server.";
    } else {
      errorMessage.value = "Terjadi kesalahan. Silakan coba lagi.";
    }
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
          Selamat Datang
        </h1>

        <p class="mt-2 text-sm text-slate-400">
          Masuk untuk melacak atau membuat tiket bantuan
        </p>
      </div>

      <form class="space-y-5 rounded-2xl border border-slate-100 p-6 shadow-2xl sm:p-8" @submit.prevent="handleLogin">
        <div v-if="errorMessage" role="alert" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {{ errorMessage }}
        </div>

        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium">
            Alamat Email
          </label>

          <input id="email" v-model="email" type="email" placeholder="you@example.com" required class="w-full rounded-lg border border-slate-200/75 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"/>
        </div>

        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium">
            Kata Sandi
          </label>

          <input id="password" v-model="password" type="password" placeholder="Masukkan kata sandi anda" required class="w-full rounded-lg border border-slate-200/75 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"/>
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
          {{ authStore.isLoading ? "Memuat..." : "Masuk" }}
        </button>
        <p class="text-sm flex gap-2">Belum punya akun? <RouterLink :to="{ name: 'register' }" class="text-indigo-700 underline">Daftar</RouterLink> </p>
      </form>
    </section>
  </main>
</template>
