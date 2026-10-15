// ==============================================================================
// Скрипт: Сдвиг только панели «Фасад ящика» влево на 0.605 мм (без фурнитуры)
// ==============================================================================

var shiftDistance = -0.605; // сдвиг влево по оси X
var foundCount = 0;

// Рекурсивный поиск детали "Фасад ящика" по структуре открытой модели
function searchAndShiftFacade(parent) {
    if (!parent || !parent.Count) return;

    for (var i = 0; i < parent.Count; i++) {
        var obj = parent.Objects[i];

        // Проверяем, является ли объект панелью с именем "Фасад ящика"
        if (obj.AsPanel && obj.Name.indexOf('Фасад ящика') !== -1) {
            obj.PositionX += shiftDistance;
            obj.Build();
            foundCount++;
        }

        // Если это вложенный блок или сборка — идем вглубь
        if (obj.Count && obj.Count > 0) {
            searchAndShiftFacade(obj);
        }
    }
}

// Запускаем поиск по всей модели
searchAndShiftFacade(Model);

Action.Commit();

if (foundCount > 0) {
    alert('Готово!\nСдвинуто панелей фасада: ' + foundCount + '\nСмещение: 0.605 мм влево.\nФурнитура осталась на месте.');
} else {
    alert('Панель с именем "Фасад ящика" не найдена среди панелей модели.');
}
