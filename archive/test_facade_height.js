// Тест с проверкой реальной высоты фасада после ElasticResize
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

function getFacade(block) {
    for (var i = 0; i < block.Count; i++) {
        var obj = block.Objects[i];
        if (obj.Name === 'Фасад ящика' && obj.GSize.y > 50) return obj;
        if (obj.Count) {
            var sub = getFacade(obj);
            if (sub) return sub;
        }
    }
    return null;
}

var facadeBefore = getFacade(dBlock);
var hBefore = facadeBefore ? facadeBefore.GSize.y : 0;

// Пробуем вызвать ElasticResize по высоте на 280 мм
dBlock.ElasticResize(NewVector(568, 280, dBlock.GSize.z));

var facadeAfter = getFacade(dBlock);
var hAfter = facadeAfter ? facadeAfter.GSize.y : 0;

alert('Высота фасада ДО: ' + hBefore.toFixed(1) + '\n' +
      'Высота фасада ПОСЛЕ: ' + hAfter.toFixed(1) + '\n' +
      'Общая высота блока ПОСЛЕ: ' + dBlock.GSize.y.toFixed(1));
