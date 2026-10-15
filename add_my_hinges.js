// =========================================================================
// Скрипт установки кастомной петли "петля МОЯ" на выбранные стойки
// Отверстия: d35x13 + 3x4 к фасаду, 5x13 к стойке
// Базис-Мебельщик 2022 JS
// =========================================================================

// Пути к вашей настроенной петле (основной и резервный локальный в проекте)
var HINGE_PATH_PRIMARY = 'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\Петли без заглушек и крестообр. планка\\Петля_CLIP top, CLIP без заглушек\\петля МОЯ.f3d';
var HINGE_PATH_LOCAL   = 'Z:\\Work\\генерация мебели\\furn\\петля_моя.f3d';

var hingeObj = null;

try {
    hingeObj = OpenFurniture(HINGE_PATH_PRIMARY);
} catch (e1) {
    try {
        hingeObj = OpenFurniture(HINGE_PATH_LOCAL);
    } catch (e2) {
        var userPath = system.askFileName('f3d;fr3d');
        if (userPath) hingeObj = OpenFurniture(userPath);
    }
}

if (!hingeObj) {
    alert('Не удалось открыть файл "петля МОЯ.f3d"!');
} else {
    // 1. Поиск выделенных стоек и всех фасадов
    var selectedPosts = [];
    var allDoors = [];

    function scanScene(container) {
        if (!container) return;
        for (var i = 0; i < container.Count; i++) {
            var obj = container.Objects[i];
            if (obj.AsPanel) {
                var name = (obj.Name || '').toLowerCase();
                var thickX  = obj.GabMax.x - obj.GabMin.x;
                var heightY = obj.GabMax.y - obj.GabMin.y;
                var depthZ  = obj.GabMax.z - obj.GabMin.z;

                // Стойка: выделена, вертикальная (толщина по X <= 35 мм, высота > 200 мм)
                if (obj.Selected && thickX <= 35 && heightY > 200 && depthZ > 80 && name.indexOf('фасад') === -1) {
                    selectedPosts.push(obj);
                }

                // Фасад: фронтальная панель
                if (name.indexOf('фасад') !== -1 || (depthZ <= 30 && thickX > 150)) {
                    allDoors.push(obj);
                }
            }
            if (obj.Count && obj.Count > 0) scanScene(obj);
        }
    }

    scanScene(Model);

    if (selectedPosts.length === 0) {
        alert('Сначала выделите в 3D стойку (боковину или перегородку), на которую нужно поставить петли!');
    } else {
        // 2. Запрос количества петель
        var countInput = prompt('Установка "петля МОЯ" (3х4 к фасаду, 5х13 к стойке).\n\nВведите количество петель на дверь (2, 3, 4, 5):', '4');
        var hingeCount = parseInt(countInput, 10);
        if (isNaN(hingeCount) || hingeCount < 2) hingeCount = 4;

        var edgeOffset = 100; // Отступ крайних петель от верха и низа двери (мм)
        var totalMounted = 0;

        // 3. Расстановка петель для каждой выделенной стойки
        for (var p = 0; p < selectedPosts.length; p++) {
            var post = selectedPosts[p];
            var pMinX = post.GabMin.x;
            var pMaxX = post.GabMax.x;
            var zFront = post.GabMax.z;

            // Поиск смежных дверей слева и справа от стойки
            var doorLeft = null;
            var doorRight = null;

            for (var d = 0; d < allDoors.length; d++) {
                var door = allDoors[d];
                // Пересечение по высоте со стойкой
                if (door.GabMax.y > post.GabMin.y && door.GabMin.y < post.GabMax.y) {
                    // Дверь справа от стойки
                    if (Math.abs(door.GabMin.x - pMaxX) < 25 || Math.abs(door.GabMin.x - pMinX) < 25) {
                        doorRight = door;
                    }
                    // Дверь слева от стойки
                    if (Math.abs(door.GabMax.x - pMinX) < 25 || Math.abs(door.GabMax.x - pMaxX) < 25) {
                        doorLeft = door;
                    }
                }
            }

            // Определение целевых дверей для навешивания
            var targets = [];
            if (doorLeft && doorRight) {
                var sideChoice = prompt(
                    'Стойка: ' + (post.Name || 'Перегородка') + '\n' +
                    'Двери найдены с обеих сторон!\nКуда крепить петли?\n' +
                    '1 - На правую дверь\n' +
                    '2 - На левую дверь\n' +
                    '3 - На обе двери',
                    '1'
                );
                if (sideChoice === '1') targets.push({ door: doorRight, side: 'right' });
                else if (sideChoice === '2') targets.push({ door: doorLeft, side: 'left' });
                else if (sideChoice === '3') {
                    targets.push({ door: doorRight, side: 'right' });
                    targets.push({ door: doorLeft, side: 'left' });
                }
            } else if (doorRight) {
                targets.push({ door: doorRight, side: 'right' });
            } else if (doorLeft) {
                targets.push({ door: doorLeft, side: 'left' });
            }

            // Монтаж петель
            for (var t = 0; t < targets.length; t++) {
                var targetDoor = targets[t].door;
                var side = targets[t].side;

                var doorLowY = targetDoor.GabMin.y;
                var doorTopY = targetDoor.GabMax.y;

                // Расчет высот Y петель с отступами по 100 мм
                var yCoords = [];
                var yStart = doorLowY + edgeOffset;
                var yEnd = doorTopY - edgeOffset;
                var stepY = (yEnd - yStart) / (hingeCount - 1);

                for (var i = 0; i < hingeCount; i++) {
                    yCoords.push(yStart + i * stepY);
                }

                // X-стык стойки и двери
                var mountX = (side === 'right') ? pMaxX : pMinX;

                for (var k = 0; k < yCoords.length; k++) {
                    var yPos = yCoords[k];
                    try {
                        hingeObj.Mount(post, targetDoor, mountX, yPos, zFront);
                        totalMounted++;
                    } catch (err) {
                        system.log('Ошибка установки петли: ' + err);
                    }
                }
            }
        }

        Action.Commit();
        alert('Готово! Установлено петель: ' + totalMounted + '\nИспользована: "петля МОЯ.f3d" (отверстия 3х4 и 5х13).');
    }
}
