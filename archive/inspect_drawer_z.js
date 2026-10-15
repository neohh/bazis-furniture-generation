// Замер Z координат фасада и блока
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик БЕЗ_ПЛАНОК.f3d';

NewModel();
var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);

var dBlock = null;
for (var k = 0; k < wrapper.Count; k++) {
    if (wrapper.Objects[k].Name === 'ящик НОВЫЙ') {
        dBlock = wrapper.Objects[k];
        break;
    }
}
if (!dBlock && wrapper.Count > 0) dBlock = wrapper.Objects[0];

var log = [];
log.push('Блок Gab: Z = [' + dBlock.GabMin.z.toFixed(3) + ' ... ' + dBlock.GabMax.z.toFixed(3) + ']');

for (var i = 0; i < dBlock.Count; i++) {
    var obj = dBlock.Objects[i];
    if (obj.Name === 'Фасад ящика' && obj.GSize.y > 50) {
        log.push('Фасад Gab: Z = [' + obj.GabMin.z.toFixed(3) + ' ... ' + obj.GabMax.z.toFixed(3) + '] толщина=' + obj.GSize.z.toFixed(3));
    }
}

alert(log.join('\n'));
