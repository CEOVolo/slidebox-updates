console.log('=== TEST MINIMAL PLUGIN LOADED ===');
// Показываем UI
figma.showUI(__html__, { width: 400, height: 300 });
// Простой обработчик сообщений
figma.ui.onmessage = function (msg) {
    console.log('Получено сообщение:', msg);
    if (msg.type === 'test') {
        figma.ui.postMessage({
            type: 'response',
            message: 'Плагин работает!'
        });
    }
    if (msg.type === 'close') {
        figma.closePlugin();
    }
};
