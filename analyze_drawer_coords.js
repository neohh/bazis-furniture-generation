// Точный анализ координат всех элементов в блоке ящика
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

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
log.push('=== ГАБАРИТЫ ВСЕГО БЛОКА ===');
log.push('X: [' + drawerBlock.GabMin.x.toFixed(3) + ' ... ' + drawerBlock.GabMax.x.toFixed(3) + '] ширина=' + drawerBlock.GSize.x.toFixed(3));

function scan(obj, indent) {
    if (!obj) return;
    var name = obj.Name || ('[' + obj.constructor.name + ']');
    // Ищем направляющие, фасад, отверстия, боковины ящика
    var isInteresting = (name.indexOf('TANDEM') !== -1 ||
                         name.indexOf('Направляющ') !== -1 ||
                         name.indexOf('Фасад') !== -1 ||
                         name.indexOf('Боковина') !== -1 ||
                         name.indexOf('Отверстие') !== -1 ||
                         obj.constructor.name === 'TFastener');
    if (isInteresting) {
        log.push(indent + name + ' -> X: [' + obj.GabMin.x.toFixed(3) + ' ... ' + obj.GabMax.x.toFixed(3) + ']');
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            scan(obj.Objects[i], indent + '  ');
        }
    }
}

scan(drawerBlock, '');
alert(log.slice(0, 25).join('\n'));
