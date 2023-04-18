import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    // {
    //     path: '/',
    //     component: () => import('layouts/MainLayout.vue'),
    //     children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
    // },
    //
    // // Always leave this as last one,
    // // but you can also remove it
    // {
    //     path: '/:catchAll(.*)*',
    //     component: () => import('pages/ErrorNotFound.vue'),
    // },
    {
        path: '/',
        component: () => import('pages/main/index'),
    },
    // {
    //     path: '/',
    //     component: () => import('pages/main/index'),
    // },
];

export default routes;
