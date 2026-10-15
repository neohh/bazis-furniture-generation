// Тест загрузки и вставки ящика с планками в нишу 352 мм
var PRESETS_FILE = 'Z:\\Work\\генерация мебели\\fastener_presets.json';
var rawText = system.readTextFile(PRESETS_FILE);
var config = JSON.parse(rawText);

NewModel();

var pLeft = AddVertPanel(0, 0, 560, 1000, 616);
var pRight = AddVertPanel(0, 0, 560, 1000, 984);
var floor = AddHorizPanel(632, 0, 984, 560, 76);

var drawerPath = config.drawers['box_with_planks'].path;
alert('Путь к ящику: ' + drawerPath);

var wrapper = AddBlock('Контейнер');
try {
    wrapper.Load(drawerPath);
    alert('wrapper.Count = ' + wrapper.Count + ', GabMin.x = ' + wrapper.GabMin.x);
} catch (e) {
    alert('Ошибка Load: ' + e);
}

var dBlock = null;
for (var k = 0; k < wrapper.Count; k++) {
    if (wrapper.Objects[k].Name === 'ящик НОВЫЙ') {
        dBlock = wrapper.Objects[k];
        break;
    }
}
if (!dBlock && wrapper.Count > 0) dBlock = wrapper.Objects[0];

alert('dBlock найден: ' + (dBlock !== null) + ', IsElastic: ' + (dBlock ? dBlock.IsElastic() : 'null'));
