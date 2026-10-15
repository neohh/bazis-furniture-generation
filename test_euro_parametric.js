// Тест установки параметрического евровинта 7х50
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60);

// Вариант 1: Через OpenFurniture по имени из базы: 'Евровинт 7х50 (Артикул 69)'
var euro = null;
var testNames = [
    'Евровинт 7х50 (Артикул 69)',
    'Евровинт 7х50',
    'Конфирмат 7х50',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Scripts\\Крепеж\\Евровинт.f3d'
];

var log = [];
for (var i = 0; i < testNames.length; i++) {
    try {
        var f = OpenFurniture(testNames[i]);
        log.push('OpenFurniture("' + testNames[i] + '") -> OK (' + f.constructor.name + ')');
        if (!euro) euro = f;
    } catch (e) {
        log.push('OpenFurniture("' + testNames[i] + '") -> FAIL: ' + e);
    }
}

// Тестируем правильную установку:
// На скриншоте: "дальний норм, который сквозь"
// Это был вызов: euro.Mount(leftSide, bottomFloor, 0, 68, 200);
if (euro) {
    try {
        euro.Mount(leftSide, bottomFloor, 0, 68, 100);
        euro.Mount(leftSide, bottomFloor, 0, 68, 460);
        log.push('Mount succeeded!');
    } catch (e2) {
        log.push('Mount err: ' + e2);
    }
}

alert(log.join('\n'));
Action.Commit();
ViewAll();
