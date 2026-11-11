// =============================================================================
// Базис-Мебельщик: Установка евровинтов на базу под мойку
// Автоматически находит боковины и вертикальные планки (царги) 80 мм
// и устанавливает по 2 евровинта (отступ 20 мм) на каждый стык
// =============================================================================

function findFastener() {
    var paths = [
        'Евровинт 7х50 (Артикул 69)',
        'Евровинт 7х50',
        'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\евровинт_7х50.f3d',
        'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\eurovint_7x50.f3d',
        'z:\\Work\\генерация мебели\\furn\\eurovint_7x50.f3d',
        'z:\\Work\\генерация мебели\\furn\\евровинт_7х50.f3d'
    ];
    for (var i = 0; i < paths.length; i++) {
        try {
            var f = OpenFurniture(paths[i]);
            if (f) return f;
        } catch (e) {}
    }
    return null;
}

function runMount() {
    var euro = findFastener();
    if (!euro) {
        alert('Не удалось загрузить модель евровинта 7х50.\nУстановите крепеж через инструмент "Крепежная фурнитура на стыки" по вашей схеме.');
        return;
    }

    var panels = [];
    function collectPanels(parent) {
        if (!parent || !parent.Count) return;
        for (var i = 0; i < parent.Count; i++) {
            var obj = parent.Objects[i];
            if (obj.AsPanel) {
                panels.push(obj);
            }
            if (obj.Count && obj.Count > 0) {
                collectPanels(obj);
            }
        }
    }
    collectPanels(Model);

    if (panels.length === 0) {
        alert('В открытой модели нет панелей. Сначала откройте файл базы мойки.');
        return;
    }

    // Ищем габариты модели
    var minX = 999999, maxX = -999999;
    var minY = 999999, maxY = -999999;
    var minZ = 999999, maxZ = -999999;

    for (var p = 0; p < panels.length; p++) {
        var b = panels[p].GBox;
        if (b.Min.x < minX) minX = b.Min.x;
        if (b.Max.x > maxX) maxX = b.Max.x;
        if (b.Min.y < minY) minY = b.Min.y;
        if (b.Max.y > maxY) maxY = b.Max.y;
        if (b.Min.z < minZ) minZ = b.Min.z;
        if (b.Max.z > maxZ) maxZ = b.Max.z;
    }

    var leftSide = null;
    var rightSide = null;
    var vertPlanks = [];
    var dno = null;

    for (var i = 0; i < panels.length; i++) {
        var pan = panels[i];
        var box = pan.GBox;
        var szX = Math.abs(box.Max.x - box.Min.x);
        var szY = Math.abs(box.Max.y - box.Min.y);
        var szZ = Math.abs(box.Max.z - box.Min.z);

        // Боковины (вертикальные панели вдоль Z)
        if (szX <= 25 && szY > 400 && szZ > 300) {
            if (box.Min.x < (minX + 50)) {
                leftSide = pan;
            } else if (box.Max.x > (maxX - 50)) {
                rightSide = pan;
            }
        }

        // Вертикальные планки (высота 60-120 мм, толщина по Z 10-25 мм, ширина по X > 300 мм)
        if (szZ <= 25 && szY >= 50 && szY <= 150 && szX > 300 && box.Max.y >= (maxY - 30)) {
            vertPlanks.push(pan);
        }

        // Дно (горизонтальная панель внизу)
        if (szY <= 25 && szX > 300 && szZ > 300 && box.Min.y < (minY + 200)) {
            dno = pan;
        }
    }

    var countMounted = 0;

    // Монтаж на вертикальные планки
    if (leftSide && rightSide && vertPlanks.length > 0) {
        for (var v = 0; v < vertPlanks.length; v++) {
            var pl = vertPlanks[v];
            var pb = pl.GBox;
            var plYTop = pb.Max.y;
            var plYBot = pb.Min.y;
            var plZMid = (pb.Min.z + pb.Max.z) / 2;

            var y1 = plYTop - 20;
            var y2 = plYBot + 20;

            try {
                // Левая боковина (винт сквозь левую боковину в торец планки)
                euro.Mount(leftSide, pl, minX, y1, plZMid);
                euro.Mount(leftSide, pl, minX, y2, plZMid);
                countMounted += 2;

                // Правая боковина (винт сквозь правую боковину в торец планки)
                euro.Mount(rightSide, pl, maxX, y1, plZMid);
                euro.Mount(rightSide, pl, maxX, y2, plZMid);
                countMounted += 2;
            } catch (errPlank) {
                system.log('Ошибка при установке на планку: ' + errPlank);
            }
        }
    }

    Action.Commit();
    ViewAll();

    alert('Готово!\nУстановлено евровинтов: ' + countMounted + ' шт.\n' +
          'Найдено вертикальных планок: ' + vertPlanks.length + ' шт.\n\n' +
          'Не забудьте сохранить файл (Ctrl+S).');
}

runMount();
