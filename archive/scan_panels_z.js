// Анализ всех панелей ящика по Z
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
function scanZ(obj) {
    if (!obj) return;
    if (obj.constructor.name === 'TFurnPanel' || obj.Name.indexOf('Фасад') !== -1 || obj.Name.indexOf('TANDEM') !== -1) {
        log.push(obj.Name + ' [' + obj.constructor.name + '] -> Z: [' + obj.GabMin.z.toFixed(1) + ' ... ' + obj.GabMax.z.toFixed(1) + ']');
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) scanZ(obj.Objects[i]);
    }
}
scanZ(dBlock);
alert(log.slice(0, 15).join('\n'));
