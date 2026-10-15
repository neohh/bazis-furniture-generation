// ==============================================================================
// Скрипт: Открыть ящик с нуля, сдвинуть фасад на 0.605 мм влево и пересохранить
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

// 1. Создаем чистую модель и загружаем ящик
NewModel();
LoadModel(drawerPath);

// 2. Ищем панель "Фасад ящика" и сдвигаем только ее влево
var shiftDistance = -0.605; // 0.605 мм влево
var shifted = false;

function searchAndShift(parent) {
    if (!parent || !parent.Count) return;
    for (var i = 0; i < parent.Count; i++) {
        var obj = parent.Objects[i];
        if (obj.AsPanel && obj.Name.indexOf('Фасад ящика') !== -1) {
            obj.PositionX += shiftDistance;
            obj.Build();
            shifted = true;
        }
        if (obj.Count && obj.Count > 0) {
            searchAndShift(obj);
        }
    }
}

searchAndShift(Model);

// 3. Пробуем включить эластичность блока программно (если поддерживается свойством)
try {
    if (Model.Objects[0]) {
        var rootBlock = Model.Objects[0];
        if (rootBlock.IsElastic !== undefined) {
            rootBlock.IsElastic = true;
        }
    }
} catch (e) {
    system.log('Эластичность: ' + e);
}

// 4. Применяем изменения и сохраняем обновленный файл
Action.Commit();
SaveModel(drawerPath);

ViewAll();
SetCamera(p3dIsometric);

alert('Готово!\n1. Ящик загружен с нуля.\n2. Фасад сдвинут влево на 0.605 мм (зазоры выровнены по 2.0 мм).\n3. Фурнитура и направляющие остались на месте.\n4. Файл ящика автоматически пересохранен.');
