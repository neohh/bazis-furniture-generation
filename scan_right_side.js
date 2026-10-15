// Замер правых элементов направляющей и отверстий
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
function deepScan(obj, path) {
    var cur = path + '/' + (obj.Name || obj.constructor.name);
    if (obj.GabMin && obj.GabMax) {
        if (obj.GabMax.x > 440) {
            log.push(cur + ' -> X: [' + obj.GabMin.x.toFixed(3) + ' ... ' + obj.GabMax.x.toFixed(3) + ']');
        }
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            deepScan(obj.Objects[i], cur);
        }
    }
}

deepScan(drawerBlock, '');
alert(log.join('\n'));
