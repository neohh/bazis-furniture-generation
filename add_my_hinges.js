// =========================================================================
// Скрипт-схема установки кастомных петель "петля МОЯ"
// Отверстия: d35x13 + 3x4 к фасаду, 5x13 к стойке
// Привязка: строго 70 мм от прилегающего дна до центра петли
// Режимы:
//   1. Интерактивная схема крепежа (клик по стойке -> клик по двери)
//   2. Пакетная установка на заранее выделенные стойки
// Базис-Мебельщик 2022 JS
// =========================================================================

var HINGE_BOTTOM_OFFSET = 70;  // Расстояние от верхней пласти прилегающего дна до центра нижней петли (мм)
var HINGE_TOP_OFFSET    = 100; // Отступ верхней петли от верхнего края двери (мм)

// Пути к настроенной петле (основной в базе Базиса и локальный в проекте)
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
    alert('Не удалось открыть файл "петля МОЯ.f3d"!\nПроверьте путь к файлу фурнитуры.');
} else {
    // 1. Сканирование сцены: поиск всех панелей для геометрии
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

                // Стойка: вертикальная (толщина по X <= 35 мм, высота > 200 мм)
                if (thickX <= 35 && heightY > 200 && depthZ > 80 && name.indexOf('фасад') === -1) {
                    if (obj.Selected) {
                        selectedPosts.push(obj);
                    }
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
                var overlapsDoorX = (hp.GabMin.x < dMaxX - 10 && hp.GabMax.x > dMinX + 10);
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

    // Функция установки петель на пару (стойка, дверь)
    function mountHingesOnPair(post, door, side, count) {
        var pMinX = post.GabMin.x;
        var pMaxX = post.GabMax.x;
        var zFront = post.GabMax.z;

        // Поиск прилегающего дна
        var bottomPanel = findAdjacentBottomPanel(post, door, side);

        // Строго 70 мм от верхней пласти дна до центра петли
        var yStart = bottomPanel ? (bottomPanel.GabMax.y + HINGE_BOTTOM_OFFSET) : (door.GabMin.y + HINGE_BOTTOM_OFFSET);
        var yEnd = door.GabMax.y - HINGE_TOP_OFFSET;

        if (yEnd <= yStart) yEnd = yStart + 100;

        var stepY = (yEnd - yStart) / (count - 1);
        var mountX = (side === 'right') ? pMaxX : pMinX;

        var mountedCount = 0;
        for (var k = 0; k < count; k++) {
            var yPos = yStart + k * stepY;
            try {
                hingeObj.Mount(post, door, mountX, yPos, zFront);
                mountedCount++;
            } catch (err) {
                system.log('Ошибка установки петли: ' + err);
            }
        }
        return mountedCount;
    }

    // Запрос количества петель на дверь
    var countInput = prompt(
        'Схема крепежа "петля МОЯ" (3х4 к фасаду, 5х13 к стойке).\n' +
        'Привязка: строго 70 мм от прилегающего дна.\n\n' +
        'Количество петель на дверь (2, 3, 4, 5):',
        '4'
    );
    var hingeCount = parseInt(countInput, 10);
    if (isNaN(hingeCount) || hingeCount < 2) hingeCount = 4;

    var totalMounted = 0;

    // ВЫБОР РЕЖИМА РАБОТЫ:
    var useInteractiveMode = true;

    if (selectedPosts.length > 0) {
        var modeChoice = prompt(
            'Найдено предварительно выделенных стоек: ' + selectedPosts.length + '.\n\n' +
            'Выберите способ установки:\n' +
            '1 - Автоматически на все выделенные стойки\n' +
            '2 - Интерактивная схема крепежа (выбирать кликом стойку и фасад)',
            '1'
        );
        if (modeChoice === '1') {
            useInteractiveMode = false;
        }
    }

    if (!useInteractiveMode) {
        // =========================================================================
        // РЕЖИМ 1: Пакетная установка на все предварительно выделенные стойки
        // =========================================================================
        for (var p = 0; p < selectedPosts.length; p++) {
            var curPost = selectedPosts[p];
            var curMinX = curPost.GabMin.x;
            var curMaxX = curPost.GabMax.x;

            var dLeft = null;
            var dRight = null;
            var minLDist = 999999;
            var minRDist = 999999;

            for (var d = 0; d < allDoors.length; d++) {
                var cDoor = allDoors[d];
                if (cDoor.GabMax.y > curPost.GabMin.y && cDoor.GabMin.y < curPost.GabMax.y) {
                    var distR = Math.abs(cDoor.GabMin.x - curMaxX);
                    if (distR < 35 && distR < minRDist) {
                        minRDist = distR;
                        dRight = cDoor;
                    }
                    var distL = Math.abs(cDoor.GabMax.x - curMinX);
                    if (distL < 35 && distL < minLDist) {
                        minLDist = distL;
                        dLeft = cDoor;
                    }
                }
            }

            var targets = [];
            if (dLeft && dRight) {
                var sChoice = prompt(
                    'Стойка: ' + (curPost.Name || 'Перегородка') + '\nДвери найдены с обеих сторон!\nКуда крепить петли?\n1 - На правую дверь\n2 - На левую дверь\n3 - На обе двери',
                    '1'
                );
                if (sChoice === '1') targets.push({ door: dRight, side: 'right' });
                else if (sChoice === '2') targets.push({ door: dLeft, side: 'left' });
                else if (sChoice === '3') {
                    targets.push({ door: dRight, side: 'right' });
                    targets.push({ door: dLeft, side: 'left' });
                }
            } else if (dRight) {
                targets.push({ door: dRight, side: 'right' });
            } else if (dLeft) {
                targets.push({ door: dLeft, side: 'left' });
            }

            for (var t = 0; t < targets.length; t++) {
                totalMounted += mountHingesOnPair(curPost, targets[t].door, targets[t].side, hingeCount);
            }
        }

        Action.Commit();
        alert('Готово! Установлено петель: ' + totalMounted + '\nБаза: 70 мм от прилегающего дна.');

    } else {
        // =========================================================================
        // РЕЖИМ 2: Интерактивная схема крепежа (клик по стойке -> клик по двери)
        // =========================================================================
        alert(
            'Запущена интерактивная СХЕМА КРЕПЕЖА ПЕТЕЛЬ:\n\n' +
            '1. Кликните мышкой по стойке (боковине/перегородке);\n' +
            '2. Кликните мышкой по фасаду (двери);\n' +
            '3. Петли поставятся автоматически (70 мм от дна);\n\n' +
            'Команда работает в цикле. Для завершения нажмите Esc или правую кнопку мыши.'
        );

        while (true) {
            var pickedPost = null;
            try {
                pickedPost = GetPanel('1/2: Укажите стойку/боковину (или Esc для выхода)');
            } catch (ePost) {
                pickedPost = null;
            }
            if (!pickedPost) break;

            var pickedDoor = null;
            try {
                pickedDoor = GetPanel('2/2: Укажите дверь (фасад) для этой стойки (или Esc)');
            } catch (eDoor) {
                pickedDoor = null;
            }
            if (!pickedDoor) break;

            // Автоматическое определение стороны (дверь справа или слева от стойки)
            var postCenter = (pickedPost.GabMin.x + pickedPost.GabMax.x) / 2;
            var doorCenter = (pickedDoor.GabMin.x + pickedDoor.GabMax.x) / 2;
            var pickedSide = (doorCenter > postCenter) ? 'right' : 'left';

            var countThisPair = mountHingesOnPair(pickedPost, pickedDoor, pickedSide, hingeCount);
            totalMounted += countThisPair;

            Action.Commit(); // Фиксация на экране модели
        }

        if (totalMounted > 0) {
            alert('Схема крепежа завершена!\nВсего установлено петель: ' + totalMounted + '\nПривязка: ровно 70 мм от прилегающего дна.');
        }
    }
}
