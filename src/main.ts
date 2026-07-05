import {createApp} from 'vue'
import {createRouter, createWebHistory} from 'vue-router'

import './style.css'
import App from './App.vue'

import routes from './routes'
import SessionManager from './managers/session'

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        const isAuthenticated = SessionManager.isAuthenticated()
        if (!isAuthenticated) {
            next({path: '/'})
        } else {
            next()
        }
    } else {
        next()
    }
})

createApp(App)
    .use(router)
    .mount('#app')
