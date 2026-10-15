// =========================================================================
// Скрипт добавления фасадов (дверей) по выделенным в 3D стойкам
// Базис-Мебельщик 2022 JS
// =========================================================================

var DoorGap = 1.5;        // Зазор между фасадами и по периметру (1.5 мм)
var halfGap = DoorGap / 2; // 0.75 мм — половина зазора на осевой стык

// 1. Поиск выделенных панелей (стоек)
var selectedPanels = [];

function scanScene(container) {
    if (!container) return;
    for (var i = 0; i < container.Count; i++) {
        var obj = container.Objects[i];
        if (obj.AsPanel) {
            var name = (obj.Name || '').toLowerCase();
            // Глобальные размеры по GabMin и GabMax
            var thickX  = obj.GabMax.x - obj.GabMin.x;
            var heightY = obj.GabMax.y - obj.GabMin.y;
            var depthZ  = obj.GabMax.z - obj.GabMin.z;

            // Стойка: выделена, толщина <= 35 мм, высота > 200 мм, глубина > 150 мм (не фальш-планка)
            if (obj.Selected && thickX <= 35 && heightY > 200 && depthZ > 150 && name.indexOf('фасад') === -1) {
                selectedPanels.push({
                    obj: obj,
                    name: obj.Name,
                    minX: obj.GabMin.x,
                    maxX: obj.GabMax.x,
                    minY: obj.GabMin.y,
                    maxY: obj.GabMax.y,
                    minZ: obj.GabMin.z,
                    maxZ: obj.GabMax.z
                });
            }
        }
        if (obj.Count && obj.Count > 0) scanScene(obj);
    }
}

scanScene(Model);

if (selectedPanels.length < 2) {
    alert('Сначала выделите в 3D как минимум 2 стойки (боковины или перегородки) секции шкафа!\n' +
          'Найдено стоек: ' + selectedPanels.length);
} else {
    // 2. Кластеризация стоек по оси X (если стойка разделена полками по высоте)
    selectedPanels.sort(function(a, b) { return a.minX - b.minX; });

    var clusters = [];
    for (var i = 0; i < selectedPanels.length; i++) {
        var p = selectedPanels[i];
        if (clusters.length === 0) {
            clusters.push({
                minX: p.minX,
                maxX: p.maxX,
                minY: p.minY,
                maxY: p.maxY,
                maxZ: p.maxZ,
                panels: [p]
            });
        } else {
            var last = clusters[clusters.length - 1];
            // Если координаты X совпадают с точностью до 15 мм — это одна составная стойка
            if (Math.abs(p.minX - last.minX) < 15) {
                last.minX = Math.min(last.minX, p.minX);
                last.maxX = Math.max(last.maxX, p.maxX);
                last.minY = Math.min(last.minY, p.minY);
                last.maxY = Math.max(last.maxY, p.maxY);
                last.maxZ = Math.max(last.maxZ, p.maxZ);
                last.panels.push(p);
            } else {
                clusters.push({
                    minX: p.minX,
                    maxX: p.maxX,
                    minY: p.minY,
                    maxY: p.maxY,
                    maxZ: p.maxZ,
                    panels: [p]
                });
            }
        }
    }

    if (clusters.length < 2) {
        alert('Все выделенные детали находятся на одной вертикальной оси X. Выделите стойки с разных сторон секции!');
    } else {
        // Сортировка осей слева направо
        clusters.sort(function(a, b) { return a.minX - b.minX; });

        var defaultDoors = clusters.length - 1;
        var countInput = prompt(
            'Найдено вертикальных осей/стоек: ' + clusters.length + '.\n' +
            'Число проёмов шкафа: ' + defaultDoors + '.\n\n' +
            'Сколько дверей создать?\n' +
            '(По умолчанию: ' + defaultDoors + ' — по одной на каждый проём между стойками):',
            defaultDoors.toString()
        );

        var numDoors = parseInt(countInput, 10);
        if (isNaN(numDoors) || numDoors <= 0) numDoors = defaultDoors;

        // Расчет общей высоты по крайним стойкам
        var totalMinY = clusters[0].minY;
        var totalMaxY = clusters[0].maxY;
        for (var c = 1; c < clusters.length; c++) {
            totalMinY = Math.min(totalMinY, clusters[c].minY);
            totalMaxY = Math.max(totalMaxY, clusters[c].maxY);
        }

        var doorY1 = totalMinY + DoorGap;
        var doorY2 = totalMaxY - DoorGap;

        var heightChoice = prompt(
            'Высота дверей:\n' +
            '1 - По всей высоте стоек (' + Math.round(doorY1) + ' .. ' + Math.round(doorY2) + ' мм)\n' +
            '2 - Нижняя часть (тумба, нижняя половина)\n' +
            '3 - Верхняя часть (антресоль, верхняя половина)',
            '1'
        );

        if (heightChoice === '2') {
            doorY2 = totalMinY + (totalMaxY - totalMinY) / 2 - halfGap;
        } else if (heightChoice === '3') {
            doorY1 = totalMinY + (totalMaxY - totalMinY) / 2 + halfGap;
        }

        var createdDoors = [];

        // ВАРИАНТ А: число дверей совпадает с числом проёмов между стойками
        // Двери центрируются строго по серединам промежуточных стоек (зелёная линия)
        if (numDoors === (clusters.length - 1)) {
            for (var d = 0; d < numDoors; d++) {
                var leftAxis = clusters[d];
                var rightAxis = clusters[d + 1];

                // Левая граница X
                var x1;
                if (d === 0) {
                    // Крайняя левая стойка — отступ от наружного края
                    x1 = leftAxis.minX + DoorGap;
                } else {
                    // Промежуточная стойка — середина стойки + halfGap (0.75 мм)
                    var midL = (leftAxis.minX + leftAxis.maxX) / 2;
                    x1 = midL + halfGap;
                }

                // Правая граница X
                var x2;
                if (d === numDoors - 1) {
                    // Крайняя правая стойка — отступ от наружного края
                    x2 = rightAxis.maxX - DoorGap;
                } else {
                    // Промежуточная стойка — середина стойки - halfGap (0.75 мм)
                    var midR = (rightAxis.minX + rightAxis.maxX) / 2;
                    x2 = midR - halfGap;
                }

                // Z-координата — передний торец стоек данной секции
                var doorZ = Math.max(leftAxis.maxZ, rightAxis.maxZ);

                // AddFrontPanel(x1, y1, x2, y2, z) — ПРИНИМАЕТ ТОЧКИ ДВУХ УГЛОВ!
                var panel = AddFrontPanel(x1, doorY1, x2, doorY2, doorZ);
                panel.Name = 'Фасад ' + (d + 1);
                createdDoors.push(panel);
            }
        } else {
            // ВАРИАНТ Б: произвольное число дверей (например, 2 или 3 двери на один широкий пролёт)
            var startX = clusters[0].minX + DoorGap;
            var endX = clusters[clusters.length - 1].maxX - DoorGap;
            var totalDoorSpan = (endX - startX) - (numDoors - 1) * DoorGap;
            var singleWidth = totalDoorSpan / numDoors;
            var doorZ = clusters[0].maxZ;

            for (var k = 0; k < numDoors; k++) {
                var kX1 = startX + k * (singleWidth + DoorGap);
                var kX2 = kX1 + singleWidth;

                var panelK = AddFrontPanel(kX1, doorY1, kX2, doorY2, doorZ);
                panelK.Name = 'Фасад ' + (k + 1);
                createdDoors.push(panelK);
            }
        }

        Action.Commit();
        alert('Успешно создано дверей: ' + createdDoors.length);
    }
}
