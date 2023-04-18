import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/error/index'),
    },
    {
        path: '/',
        component: () => import('pages/main/index'),
    },
];

export default routes;
