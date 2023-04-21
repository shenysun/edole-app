import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOSStore = defineStore('os', () => {
    const platform = ref('');

    const setPlatform = (p: string) => {
        platform.value = p;
    };

    return {
        platform,
        setPlatform,
    };
});
