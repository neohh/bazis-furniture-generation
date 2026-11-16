// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 перед + 0.4 корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
// =========================================================================

Action.AsyncExec(function() {
    try {
        // --- 1. ШАГ 1: ВЫБОР ДЕТАЛЕЙ ДЛЯ КРОМЛЕНИЯ ---
        var rawPanels = [];

        function extractPanels(obj, list) {
            if (!obj) return;
            if (obj.AsPanel) {
                list.push(obj.AsPanel);
            } else if (obj.Count && obj.Count > 0) {
                for (var i = 0; i < obj.Count; i++) {
                    var child = obj.Objects ? obj.Objects[i] : obj[i];
                    extractPanels(child, list);
                }
            }
        }

        function isFacadePanel(obj) {
            if (!obj || !obj.AsPanel) return false;
            var nm = (obj.Name || '').toLowerCase();
            if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('створ') !== -1) {
                return true;
            }
            return false;
        }

        function isBackWall(obj) {
            if (!obj || !obj.AsPanel) return false;
            var nm = (obj.Name || '').toLowerCase();
            if (nm.indexOf('двп') !== -1 || nm.indexOf('хдф') !== -1 || nm.indexOf('задн') !== -1) {
                return true;
            }
            var thX = obj.GabMax.x - obj.GabMin.x;
            var thY = obj.GabMax.y - obj.GabMin.y;
            var thZ = obj.GabMax.z - obj.GabMin.z;
            var minTh = Math.min(thX, Math.min(thY, thZ));
            if (minTh < 8.0) return true;
            return false;
        }

        if (Model.SelectionCount > 0) {
            for (var s = 0; s < Model.SelectionCount; s++) {
                extractPanels(Model.Selections[s], rawPanels);
            }
        } else {
            Action.Hint = 'Шаг 1/3: Кликните детали корпуса (Esc - закончить выбор или Esc сразу для ВСЕГО шкафа)';
            while (true) {
                var picked = null;
                try {
                    picked = GetPanel('Кликните деталь (Esc - готово / весь шкаф)');
                } catch(ePick) {
                    picked = null;
                }
                if (!picked) break;
                extractPanels(picked, rawPanels);
            }
            if (rawPanels.length === 0) {
                extractPanels(Model, rawPanels);
            }
        }

        var targetPanels = [];
        var skippedFacades = 0;
        var seenPanels = [];

        function isAlreadyInTarget(p) {
            for (var k = 0; k < seenPanels.length; k++) {
                if (seenPanels[k] === p) return true;
            }
            return false;
        }

        for (var pIdx = 0; pIdx < rawPanels.length; pIdx++) {
            var pObj = rawPanels[pIdx];
            if (!pObj) continue;
            if (isAlreadyInTarget(pObj)) continue;
            seenPanels.push(pObj);

            if (isFacadePanel(pObj)) {
                skippedFacades++;
                continue;
            }
            if (isBackWall(pObj)) {
                continue;
            }
            targetPanels.push(pObj);
        }

        if (targetPanels.length === 0) {
            alert('Не выбрано ни одной детали корпуса для кромления!');
            Action.Finish();
            return;
        }

        // --- 2. ШАГ 2: УКАЗАНИЕ ПЕРЕДНЕЙ (ЛИЦЕВОЙ) СТОРОНЫ ШКАФА ---
        var frontDir = { x: 0, y: 0, z: 1 }; // По умолчанию вперед по оси +Z

        Action.Hint = 'Шаг 2/3: Кликните ПЕРЕДНЕЕ (лицевое) ребро шкафа (Esc/Enter - направление вперед по Z)';
        try {
            var eFront = GetEdge('Шаг 2/3: Кликните ПЕРЕДНЕЕ ребро шкафа (Esc - авто вперед по Z)', AxisY);
            if (eFront && eFront.First && eFront.Second) {
                var edgeMidZ = (eFront.First.z + eFront.Second.z) / 2;
                var modelMidZ = (Model.GabMax.z + Model.GabMin.z) / 2;
                if (edgeMidZ < modelMidZ) {
                    frontDir = { x: 0, y: 0, z: -1 };
                } else {
                    frontDir = { x: 0, y: 0, z: 1 };
                }
            }
        } catch(eEdge) {
            frontDir = { x: 0, y: 0, z: 1 };
        }

        // --- 3. ШАГ 3: ВЫБОР КРОМКИ 0.8 И 0.4 ИЗ БАЗЫ ---
        Action.Hint = 'Шаг 3/3: Выберите кромку 0.8 мм (для передних торцов) в строке вверху';
        var mat08 = NewButtMaterialInput('Кромка 0.8 мм (лицевая сторона)');
        if (!mat08) {
            Action.Finish();
            return;
        }
        mat08.Thickness = 0.8;
        mat08.ClipPanel = true;

        Action.Hint = 'Шаг 3/3: Выберите кромку 0.4 мм (для открытого корпуса) в строке вверху';
        var mat04 = NewButtMaterialInput('Кромка 0.4 мм (открытый корпус)');
        if (!mat04) {
            Action.Finish();
            return;
        }
        mat04.Thickness = 0.4;
        mat04.ClipPanel = true;

        // --- 4. РАСЧЕТ И НАНЕСЕНИЕ КРОМКИ ---
        function getFrontContourIndex(pan, fDir) {
            if (!pan || !pan.Contour || pan.Contour.Count === 0) return -1;
            var bestIdx = -1;
            var maxProj = -1e9;
            for (var i = 0; i < pan.Contour.Count; i++) {
                var elem = pan.Contour[i];
                if (elem && elem.Pos1 && elem.Pos2) {
                    var p1 = pan.ToGlobal(NewVector(elem.Pos1.x, elem.Pos1.y, 0));
                    var p2 = pan.ToGlobal(NewVector(elem.Pos2.x, elem.Pos2.y, 0));
                    var midX = (p1.x + p2.x) / 2;
                    var midY = (p1.y + p2.y) / 2;
                    var midZ = (p1.z + p2.z) / 2;
                    var proj = midX * fDir.x + midY * fDir.y + midZ * fDir.z;
                    if (proj > maxProj) {
                        maxProj = proj;
                        bestIdx = i;
                    }
                }
            }
            return bestIdx;
        }

        var countPanels = 0;
        var countFrontEdges = 0;
        var countOpenEdges = 0;

        for (var i = 0; i < targetPanels.length; i++) {
            var pan = targetPanels[i];
            StartEditing(pan);
            pan.Butts.Clear();

            if (pan.Contour && pan.Contour.Count) {
                var fIndex = getFrontContourIndex(pan, frontDir);

                for (var ce = 0; ce < pan.Contour.Count; ce++) {
                    if (ce === fIndex) {
                        // ЛИЦЕВОЙ ПЕРЕДНИЙ ТОРЕЦ -> КРОМКА 0.8 ММ
                        var b08 = pan.AddButt(mat08, ce);
                        if (b08) {
                            b08.ClipPanel = true;
                            countFrontEdges++;
                        }
                    } else if (pan.IsButtVisible(ce, 5)) {
                        // ОТКРЫТЫЙ НАРУЖНЫЙ ТОРЕЦ КОРПУСА -> КРОМКА 0.4 ММ
                        var b04 = pan.AddButt(mat04, ce);
                        if (b04) {
                            b04.ClipPanel = true;
                            countOpenEdges++;
                        }
                    }
                    // ЗАКРЫТЫЕ СТЫКИ ДЕТАЛЕЙ ОСТАЮТСЯ БЕЗ КРОМКИ (ЧИСТЫЕ)
                }
            }
            pan.Build();
            countPanels++;
        }

        Action.Commit();

        var summaryHint = 'Готово! Деталей: ' + countPanels + ' | Лицо 0.8: ' + countFrontEdges + ' | Корпус 0.4: ' + countOpenEdges + (skippedFacades > 0 ? ' | Фасады пропущены: ' + skippedFacades : '');
        Action.Hint = summaryHint;

        var msg = 'Умная облицовка корпуса завершена!\n' +
            '-----------------------------------------\n' +
            'Обработано деталей: ' + countPanels + ' шт.\n' +
            '  - Лицевые торцы (0.8 мм): ' + countFrontEdges + ' шт.\n' +
            '  - Открытые торцы корпуса (0.4 мм): ' + countOpenEdges + ' шт.\n' +
            '  - Стыки деталей: без кромки (чистые)\n' +
            (skippedFacades > 0 ? '  - Фасады и двери: не кромятся (' + skippedFacades + ' шт.)\n' : '') +
            '-----------------------------------------\n' +
            'Все кромки нанесены с подрезкой (ClipPanel = true).';

        alert(msg);
    } catch(err) {
        alert('Ошибка при выполнении: ' + err.message);
    }
});

Action.Continue();