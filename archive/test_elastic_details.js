// Диагностика эластичности и тест NewVector
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
log.push('Block: ' + drawerBlock.Name);
log.push('Исходный GSize: ' + drawerBlock.GSize.x.toFixed(1) + ' x ' + drawerBlock.GSize.y.toFixed(1) + ' x ' + drawerBlock.GSize.z.toFixed(1));
log.push('IsElastic: ' + drawerBlock.IsElastic());

// 1. Создаем вектор через NewVector
var v = NewVector(600, drawerBlock.GSize.y, drawerBlock.GSize.z);
log.push('NewVector v: (' + v.x + ', ' + v.y + ', ' + v.z + ')');

// 2. Вызываем ElasticResize с NewVector
try {
    drawerBlock.ElasticResize(v);
    log.push('После ElasticResize(v): GSize.x = ' + drawerBlock.GSize.x.toFixed(1));
} catch (e) {
    log.push('ElasticResize error: ' + e);
}

// 3. Если размер не поменялся, проверяем вложенный фасад
for (var j = 0; j < drawerBlock.Count; j++) {
    var sub = drawerBlock.Objects[j];
    if (sub.IsElastic && sub.IsElastic()) {
        log.push('Подблок с эластичностью: ' + sub.Name);
        try {
            var subV = NewVector(600, sub.GSize.y, sub.GSize.z);
            sub.ElasticResize(subV);
            log.push('  после sub.ElasticResize: GSize.x = ' + sub.GSize.x.toFixed(1));
        } catch (e2) {
            log.push('  sub error: ' + e2);
        }
    }
}

alert(log.join('\n'));

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
