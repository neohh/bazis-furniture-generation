// Замер точных Z координат в готовой тестовой сцене
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик БЕЗ_ПЛАНОК.f3d';

NewModel();

var nicheWidth = 600;  
var nicheHeight = 1000;
var nicheDepth = 500;
var thick = 16;

var leftPost = AddVertPanel(0, 0, nicheDepth, nicheHeight, 0);
var bottomPanel = AddHorizPanel(thick, 0, nicheWidth - thick, nicheDepth, 0);

var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);
var dBlock = wrapper.Objects[0];

// При shiftZ = 0 - dBlock.GabMin.z:
var shiftZ_old = 0 - dBlock.GabMin.z; // 528
dBlock.Translate(NewVector(0, 0, shiftZ_old));

var facade = null;
for (var i = 0; i < dBlock.Count; i++) {
    if (dBlock.Objects[i].Name === 'Фасад ящика' && dBlock.Objects[i].GSize.y > 50) {
        facade = dBlock.Objects[i];
        break;
    }
}

alert('Стойка Z: [' + leftPost.GabMin.z.toFixed(1) + ' ... ' + leftPost.GabMax.z.toFixed(1) + ']\n' +
      'Фасад Z: [' + (facade ? facade.GabMin.z.toFixed(1) : 0) + ' ... ' + (facade ? facade.GabMax.z.toFixed(1) : 0) + ']\n' +
      'Дно Z: [' + bottomPanel.GabMin.z.toFixed(1) + ' ... ' + bottomPanel.GabMax.z.toFixed(1) + ']');
