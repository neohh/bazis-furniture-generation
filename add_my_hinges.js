// =========================================================================
// Скрипт установки кастомной петли "петля МОЯ" на выбранные стойки
// Отверстия: d35x13 + 3x4 к фасаду, 5x13 к стойке
// База: строго 70 мм от прилегающего дна до центра петли
// Базис-Мебельщик 2022 JS
// =========================================================================

var HINGE_BOTTOM_OFFSET = 70;  // Расстояние от верхней пласти прилегающего дна до центра нижней петли (мм)
var HINGE_TOP_OFFSET    = 100; // Отступ верхней петли от верхнего края двери (мм)

// Пути к настроенной петле (основной и резервный локальный в проекте)
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
    // 1. Сбор объектов сцены: стойки, двери и горизонтальные панели (дно/полки)
    var selectedPosts  = [];
    var allDoors       = [];
    var allHorizPanels = [];

    function scanScene(container) {
        if (!container) return;
        for (var i = 0; i < container.Count; i++) {
            var obj = container.Objects[i];
            if (obj.AsPanel) {
                var name = (obj.Name || '').toLowerCase();
                var thickX  = obj.GabMax.x - obj.GabMin.x;
                var thickY  = obj.GabMax.y - obj.GabMin.y;
                var heightY = obj.GabMax.y - obj.GabMin.y;
                var depthZ  = obj.GabMax.z - obj.GabMin.z;
                var widthX  = obj.GabMax.x - obj.GabMin.x;

                // Стойка: выделена, вертикальная (толщина по X <= 35 мм, высота > 200 мм)
                if (obj.Selected && thickX <= 35 && heightY > 200 && depthZ > 80 && name.indexOf('фасад') === -1) {
                    selectedPosts.push(obj);
                }

                // Фасад: фронтальная панель
                if (name.indexOf('фасад') !== -1 || (depthZ <= 30 && widthX > 150)) {
                    allDoors.push(obj);
                }

                // Горизонтальная панель (дно корпуса, полка, крышка)
                if (thickY <= 35 && widthX > 80 && depthZ > 80 && name.indexOf('фасад') === -1) {
                    allHorizPanels.push(obj);
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
        var countInput = prompt(
            'Установка "петля МОЯ" (3х4 к фасаду, 5х13 к стойке).\n' +
            'Привязка: строго 70 мм от прилегающего дна до центра петли.\n\n' +
            'Введите количество петель на дверь (2, 3, 4, 5):',
            '4'
        );
        var hingeCount = parseInt(countInput, 10);
        if (isNaN(hingeCount) || hingeCount < 2) hingeCount = 4;

        var totalMounted = 0;

        // Функция поиска прилегающего к стойке дна секции двери
        function findAdjacentBottomPanel(post, targetDoor, side) {
            var pMinX = post.GabMin.x;
            var pMaxX = post.GabMax.x;
            var dMinX = targetDoor.GabMin.x;
            var dMaxX = targetDoor.GabMax.x;

            var bestPanel = null;
            var minFloorY = 999999;

            for (var h = 0; h < allHorizPanels.length; h++) {
                var hp = allHorizPanels[h];
                var hpMinY = hp.GabMin.y;

                // Панель в нижней части секции (ниже 45% высоты двери)
                if (hpMinY < targetDoor.GabMin.y + (targetDoor.GabMax.y - targetDoor.GabMin.y) * 0.45) {
                    // Перекрытие по X с проёмом двери
                    var overlapsDoorX = (hp.GabMin.x < dMaxX - 10 && hp.GabMax.x > dMinX + 10);

                    // Прилегание к стойке с нужной стороны
                    var touchesPost = false;
                    if (side === 'right') {
                        touchesPost = (Math.abs(hp.GabMin.x - pMaxX) < 25 || (hp.GabMin.x <= pMaxX && hp.GabMax.x > pMaxX));
                    } else {
                        touchesPost = (Math.abs(hp.GabMax.x - pMinX) < 25 || (hp.GabMax.x >= pMinX && hp.GabMin.x < pMinX));
                    }
                    var underPost = (hp.GabMin.x <= pMinX + 10 && hp.GabMax.x >= pMaxX - 10);

                    if (overlapsDoorX && (touchesPost || underPost)) {
                        if (hpMinY < minFloorY) {
                            minFloorY = hpMinY;
                            bestPanel = hp;
                        }
                    }
                }
            }
            return bestPanel;
        }

        // 3. Расстановка петель для каждой выделенной стойки
        for (var p = 0; p < selectedPosts.length; p++) {
            var post = selectedPosts[p];
            var pMinX = post.GabMin.x;
            var pMaxX = post.GabMax.x;
            var zFront = post.GabMax.z;

            // Поиск ближайших смежных дверей слева и справа
            var doorLeft = null;
            var doorRight = null;
            var minLeftDist = 999999;
            var minRightDist = 999999;

            for (var d = 0; d < allDoors.length; d++) {
                var door = allDoors[d];
                // Пересечение по высоте со стойкой
                if (door.GabMax.y > post.GabMin.y && door.GabMin.y < post.GabMax.y) {
                    // Дверь справа от стойки: левый край двери стыкуется с правым краем стойки
                    var distRight = Math.abs(door.GabMin.x - pMaxX);
                    if (distRight < 35 && distRight < minRightDist) {
                        minRightDist = distRight;
                        doorRight = door;
                    }
                    // Дверь слева от стойки: правый край двери стыкуется с левым краем стойки
                    var distLeft = Math.abs(door.GabMax.x - pMinX);
                    if (distLeft < 35 && distLeft < minLeftDist) {
                        minLeftDist = distLeft;
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

                // Находим прилегающее дно секции
                var bottomPanel = findAdjacentBottomPanel(post, targetDoor, side);

                var yStart;
                if (bottomPanel) {
                    // Ровно 70 мм от верхней пласти прилегающего дна до центра петли!
                    yStart = bottomPanel.GabMax.y + HINGE_BOTTOM_OFFSET;
                } else {
                    yStart = targetDoor.GabMin.y + HINGE_BOTTOM_OFFSET;
                }

                // Верхняя петля — с отступом 100 мм от верхнего края двери
                var yEnd = targetDoor.GabMax.y - HINGE_TOP_OFFSET;

                if (yEnd <= yStart) {
                    yEnd = yStart + 100;
                }

                var stepY = (yEnd - yStart) / (hingeCount - 1);
                var mountX = (side === 'right') ? pMaxX : pMinX;

                for (var k = 0; k < hingeCount; k++) {
                    var yPos = yStart + k * stepY;
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
        alert('Готово! Установлено петель: ' + totalMounted + '\nПривязка: 70 мм от прилегающего дна.\nФайл: "петля МОЯ.f3d" (3х4 фасад, 5х13 стойка).');
    }
}
