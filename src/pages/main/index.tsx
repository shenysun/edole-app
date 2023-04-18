import { defineComponent, ref } from 'vue';
import { QBtn } from 'quasar';

export default defineComponent({
    name: 'mainView',
    setup() {
        const global = window as unknown as Record<string, Record<string, () => Promise<unknown>>>;
        const val = ref(12);
        const onTestClick = async () => {
            val.value++;
            const some = await global.shell.do();
            console.log(some);
        };
        return () => (
            <>
                <div>hello: {val.value}</div>
                <QBtn onClick={onTestClick}>点击测试</QBtn>
            </>
        );
    },
});
