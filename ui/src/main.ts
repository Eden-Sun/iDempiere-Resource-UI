import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './app/App.vue'
import './app/styles.css'

import { routes } from './app/routes'
import { useAuth } from './features/auth/store'

const auth = useAuth()
auth.load()

const router = createRouter({
  history: createWebHistory('/emui/'),
  routes,
})

router.beforeEach((to) => {
  const publicRoutes = new Set(['/login'])
  if (publicRoutes.has(to.path)) return true
  if (!auth.isAuthenticated.value) return { path: '/login' }
  return true
})

createApp(App).use(router).mount('#app')

