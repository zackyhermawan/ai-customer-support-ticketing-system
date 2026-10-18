
<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {LayoutDashboard, Ticket, ChartNoAxesCombined, ScrollText, Settings, Headset, Menu, X, LogOut, ChevronDown} from "lucide-vue-next";
import { useAuthStore } from "../modules/auth/auth.store";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const sidebarOpen = ref(false);

const navigation = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Tickets", path: "/admin/tickets", icon: Ticket },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
];

function isActive(path: string) {
    return path === "/admin" ? route.path === path : route.path.startsWith(path);
}

function logout() {
    authStore.logout();
    router.replace("/login");
}
</script>

<template>
    <div class="min-h-screen bg-slate-50 text-slate-800">
        <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" @click="sidebarOpen = false"/>

        <aside class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0" :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
            <div class="flex h-20 items-center justify-between border-b border-slate-100 px-6">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <Headset :size="21" />
                    </div>
                    <div>
                        <p class="font-bold tracking-tight text-slate-900">SupportAI</p>
                        <p class="text-xs text-slate-400">Admin workspace</p>
                    </div>
                </div>

                <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close sidebar" @click="sidebarOpen = false">
                    <X :size="19" />
                </button>
            </div>

            <div class="px-4 pt-7">
                <p class="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Navigasi Utama
                </p>

                <nav class="space-y-1">
                    <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition" :class="isActive(item.path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'" @click="sidebarOpen = false">
                        <component :is="item.icon" :size="19" />
                        <span>{{ item.label }}</span>
                        <span v-if="isActive(item.path)" class="ml-auto h-2 w-2 rounded-full bg-indigo-600"/>
                    </RouterLink>
                </nav>
            </div>

            <div class="mt-auto border-t border-slate-100 p-4">
                <button class="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50" @click="logout">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                        {{ authStore.user?.name?.charAt(0).toUpperCase() ?? "A" }}
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-slate-800">
                            {{ authStore.user?.name }}
                        </p>
                        <p class="text-xs text-slate-400">Admin</p>
                    </div>

                    <LogOut :size="17" class="text-slate-400 cursor-pointer" />
                </button>
            </div>
        </aside>

        <div class="min-h-screen lg:pl-64">
            <header class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
                <div class="flex items-center gap-3">
                    <button class="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Open sidebar" @click="sidebarOpen = true">
                        <Menu :size="20" />
                    </button>

                    <div>
                        <h1 class="text-lg font-bold text-slate-900 sm:text-xl">
                            {{ route.meta.title ?? "Dashboard" }}
                        </h1>
                        <p class="hidden text-xs text-slate-400 sm:block">
                            Pantau dan kelola dukungan pelanggan
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div class="hidden text-right sm:block">
                        <p class="text-sm font-semibold text-slate-800">
                            {{ authStore.user?.name }}
                        </p>
                        <p class="text-xs text-slate-400">Akun Admin</p>
                    </div>
                    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                        {{ authStore.user?.name?.charAt(0).toUpperCase() ?? "A" }}
                    </div>
                </div>
            </header>

            <main class="mx-auto max-w-[1600px] p-5 sm:p-8">
                <RouterView />
            </main>
        </div>
    </div>
</template>
