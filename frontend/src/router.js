import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import Utils from "./config/utils.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Dashboard,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

router.beforeEach((to) => {
  const user = Utils.getStore("user");
  const isAuthRoute = to.name === "login" || to.name === "register";

  if (!user && !isAuthRoute) {
    return { name: "login" };
  }

  if (user && isAuthRoute) {
    return { name: "home" };
  }

  return true;
});

export default router;
