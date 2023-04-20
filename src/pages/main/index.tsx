import { QSeparator } from 'quasar';
import { defineComponent } from 'vue';
import LoggerView from './components/logger-view';
import ProjectView from './components/project-view';
import style from './style/index.module.scss';

export default defineComponent({
    name: 'mainView',
    setup() {
        return () => (
            <>
                <div class={style['manager']}>
                    <ProjectView class={style['project-view']}></ProjectView>
                    <QSeparator></QSeparator>
                    <LoggerView class={style['logger-view']}></LoggerView>
                </div>
            </>
        );
    },
});
