import type { RouteRecordRaw } from 'vue-router'
import LoginPage from './views/LoginPage.vue'
import BookingPage from './views/BookingPage.vue'
import AdminCalendarPage from './views/AdminCalendarPage.vue'
import AdminPermissionsPage from './views/AdminPermissionsPage.vue'
import BPartnerPage from './views/BPartnerPage.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/book', component: BookingPage },
  { path: '/admin/calendar', component: AdminCalendarPage },
  { path: '/admin/permissions', component: AdminPermissionsPage },
  { path: '/bpartner', component: BPartnerPage },
]

