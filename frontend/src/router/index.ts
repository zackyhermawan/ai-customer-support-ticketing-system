import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../modules/auth/auth.store";

import LoginView from "../views/auth/LoginView.vue";
import AdminDashboardView from "../views/admin/DashboardView.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import TicketsView from "@/views/admin/TicketsView.vue";
import AuditLogsView from "../views/admin/AuditLogsView.vue";
import TicketDetailView from "@/views/admin/TicketDetailView.vue";
import CustomerLayout from "@/layouts/CustomerLayout.vue";
import CustomerTicketsView from "@/views/customer/CustomerTicketsView.vue";
import CustomerTicketDetailView from "@/views/customer/CustomerTicketDetailView.vue";
import CustomerOpenTicketView from "@/views/customer/CustomerOpenTicketView.vue";
import RegisterView from "@/views/auth/RegisterView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: "/admin",
      component: AdminLayout,
      meta: {
        requiresAuth: true,
        roles: ["ADMIN"],
      },
      children: [
        {
          path: "",
          name: "admin-dashboard",
          component: AdminDashboardView,
          meta: { title: "Dashboard" },
        },
        {
          path: "tickets",
          name: "admin-tickets",
          component: TicketsView,
          meta: { title: "Tickets" },
        },
        {
          path: "tickets/:id",
          name: "admin-ticket-detail",
          component: TicketDetailView,
          meta: { title: "Ticket Details" },
        },
        {
          path: "audit-logs",
          name: "admin-audit-logs",
          component: AuditLogsView,
          meta: { title: "Audit Logs" },
        },
      ],
    },
    {
      path: "/customer",
      component: CustomerLayout,
      meta: {
        requiresAuth: true,
        roles: ["CUSTOMER"],
      },
      children: [
        {
          path: "",
          name: "customer-ticket",
          component: CustomerTicketsView,
          meta: { title: "Ticket" },
        },
        {
          path: "tickets/:id",
          name: "customer-ticket-detail",
          component: CustomerTicketDetailView,
          meta: { title: "Ticket" },
        },
        {
          path: "open-ticket",
          name: "customer-open-ticket",
          component: CustomerOpenTicketView,
          meta: { title: "Open Ticket" },
        },
      ],
    },
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  await authStore.initialize();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return authStore.isAdmin ? { name: "admin-dashboard" } : { name: "customer-ticket" };
  }

  if (to.meta.roles && authStore.user) {
    if (!to.meta.roles.includes(authStore.user.role)) {
      return authStore.isAdmin ? { name: "customer-ticket" } : { name: "admin-dashboard" };
    }
  }
});

export default router;