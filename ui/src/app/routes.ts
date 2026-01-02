import type { RouteRecordRaw } from 'vue-router'
import LoginPage from './views/LoginPage.vue'
import BookingPage from './views/BookingPage.vue'
import AdminCalendarPage from './views/AdminCalendarPage.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/book', component: BookingPage },
  { path: '/admin/calendar', component: AdminCalendarPage },
]

