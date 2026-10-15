// Замер координат ящика БЕЗ_ПЛАНОК.f3d
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
log.push('Block: ' + drawerBlock.Name);
log.push('GSize: ' + drawerBlock.GSize.x.toFixed(3) + ' x ' + drawerBlock.GSize.y.toFixed(3) + ' x ' + drawerBlock.GSize.z.toFixed(3));
log.push('GabMin: ' + drawerBlock.GabMin.x.toFixed(3) + ', ' + drawerBlock.GabMin.y.toFixed(3) + ', ' + drawerBlock.GabMin.z.toFixed(3));
log.push('GabMax: ' + drawerBlock.GabMax.x.toFixed(3) + ', ' + drawerBlock.GabMax.y.toFixed(3) + ', ' + drawerBlock.GabMax.z.toFixed(3));
log.push('IsElastic: ' + drawerBlock.IsElastic());

function scan(obj) {
    if (!obj) return;
    var name = obj.Name || '';
    if (name.indexOf('TANDEM') !== -1 || name.indexOf('Направляющ') !== -1 || name.indexOf('Фасад') !== -1) {
        log.push(name + ' -> X: [' + obj.GabMin.x.toFixed(3) + ' ... ' + obj.GabMax.x.toFixed(3) + ']');
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) scan(obj.Objects[i]);
    }
}
scan(drawerBlock);
alert(log.join('\n'));
