import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/error/index.vue'),
    },
    {
        path: '/',
        component: () => import('src/layout/index.vue'),
        children: [
            {
                path: '',
                component: () => import('pages/main/index.vue'),
            },
        ],
    },
];

export default routes;
