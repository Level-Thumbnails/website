export default [
    { path: '/', component: () => import('./pages/HomePage.vue') },
    { path: '/dashboard', component: () => import('./pages/DashboardPage.vue'), meta: { requiresAuth: true } },
    { path: '/privacy', component: () => import('./pages/PrivacyPage.vue') },
    { path: '/terms', component: () => import('./pages/TermsPage.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFoundPage.vue') } // Catch-all for 404
]