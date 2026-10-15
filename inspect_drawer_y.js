// Анализ координат фасада по Y внутри блока
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик БЕЗ_ПЛАНОК.f3d';

NewModel();
var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);

var drawerBlock = null;
for (var i = 0; i < wrapper.Count; i++) {
    if (wrapper.Objects[i].Name === 'ящик НОВЫЙ') {
        drawerBlock = wrapper.Objects[i];
        break;
    }
}
if (!drawerBlock && wrapper.Count > 0) drawerBlock = wrapper.Objects[0];

var log = [];
log.push('=== БЛОК ВСЕГО ===');
log.push('Y: [' + drawerBlock.GabMin.y.toFixed(3) + ' ... ' + drawerBlock.GabMax.y.toFixed(3) + '] высота GSize.y=' + drawerBlock.GSize.y.toFixed(3));

function scanY(obj) {
    if (!obj) return;
    var name = obj.Name || ('[' + obj.constructor.name + ']');
    if (name.indexOf('Фасад') !== -1 || name.indexOf('Дно') !== -1 || name.indexOf('TANDEM') !== -1) {
        log.push(name + ' -> Y: [' + obj.GabMin.y.toFixed(3) + ' ... ' + obj.GabMax.y.toFixed(3) + '] H=' + obj.GSize.y.toFixed(3));
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) scanY(obj.Objects[i]);
    }
}
scanY(drawerBlock);
alert(log.join('\n'));
