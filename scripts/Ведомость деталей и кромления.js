// =============================================================================
// Базис-Мебельщик: Скрипт формирования ведомости деталей и кромления
// Создает производственную таблицу (Поз., Длина, Ширина, Кол-во)
// с наглядным обозначением кромок (сплошная, пунктир, точки и т.д.)
// и автоматическим расчетом требуемой длины каждой кромки (в метрах)
// =============================================================================

(function() {
    // 1. Сбор всех панелей модели
    var allPanels = [];
    
    function collectPanels(obj) {
        if (!obj) return;
        if (obj.List && obj.Count) {
            for (var i = 0; i < obj.Count; i++) {
                collectPanels(obj.Objects ? obj.Objects[i] : obj[i]);
            }
        } else if (obj.Contour && obj.Contour.Count >= 3 && obj.GSize) {
            allPanels.push(obj);
        }
    }

    if (Model.forEachPanel) {
        Model.forEachPanel(function(p) {
            allPanels.push(p);
        });
    } else {
        collectPanels(Model);
    }

    if (allPanels.length === 0) {
        alert('В модели не найдено ни одной панели!');
        Action.Finish();
        return;
    }

    // 2. Поиск всех уникальных кромочных материалов в модели
    var uniqueButtsMap = {};
    for (var p = 0; p < allPanels.length; p++) {
        var pan = allPanels[p];
        if (pan.Butts && pan.Butts.Count) {
            for (var b = 0; b < pan.Butts.Count; b++) {
                var bt = pan.Butts.Butts ? pan.Butts.Butts[b] : pan.Butts[b];
                if (bt && bt.Material && bt.Thickness > 0) {
                    var matKey = bt.Material.trim();
                    if (!uniqueButtsMap[matKey]) {
                        uniqueButtsMap[matKey] = {
                            name: matKey,
                            thickness: bt.Thickness
                        };
                    }
                }
            }
        }
    }

    var edgeMaterialsList = [];
    for (var k in uniqueButtsMap) {
        edgeMaterialsList.push(uniqueButtsMap[k]);
    }

    // Сортируем кромки: сначала более толстые (0.8 / 1.0 / 2.0), затем более тонкие (0.4)
    edgeMaterialsList.sort(function(a, b) {
        return b.thickness - a.thickness;
    });

    var styleOptions = [
        'Сплошная линия (————)',
        'Пунктирная линия (– – – –)',
        'Точечная линия (· · · · ·)',
        'Двойная сплошная (════)',
        'Штрихпунктирная (– · – ·)'
    ];

    var styleKeys = ['solid', 'dashed', 'dotted', 'double', 'dashdot'];

    // 3. Создание панели свойств в Базисе
    var prop = Action.Properties;
    prop.Clear();

    var grEdges = prop.NewGroup('Обозначение кромок в таблице');
    var edgeStyleSelectors = {};

    for (var m = 0; m < edgeMaterialsList.length; m++) {
        var matObj = edgeMaterialsList[m];
        var defaultIdx = m % styleKeys.length;
        // По умолчанию: первая кромка (0.8) - Сплошная, вторая (0.4) - Пунктир
        var combo = grEdges.NewCombo(matObj.name + ' (' + matObj.thickness + ' мм)', styleOptions.join('\n'));
        combo.ItemIndex = defaultIdx;
        edgeStyleSelectors[matObj.name] = combo;
    }

    var grParams = prop.NewGroup('Параметры таблицы');
    var marginProp = grParams.NewNumber('Запас на кромку (%)', 5);
    var groupProp = grParams.NewBool('Группировать одинаковые', true);
    var sortProp = grParams.NewCombo('Сортировка деталей', 'По позиции (Поз. 1, 2...)\nПо длине (убывание)\nПо наименованию');
    sortProp.ItemIndex = 0;

    var grActions = prop.NewGroup('Действия');
    var btnMake = grActions.NewButton('Сформировать ведомость (HTML)');
    var btnExcel = grActions.NewButton('Экспорт в Excel (CSV)');
    var btnClose = grActions.NewButton('Закрыть');

    // Функция генерации отчета
    function generateReport(isExcelExport) {
        // Карта стилей
        var chosenStyles = {};
        for (var matName in edgeStyleSelectors) {
            var idx = edgeStyleSelectors[matName].ItemIndex;
            if (idx < 0 || idx >= styleKeys.length) idx = 0;
            chosenStyles[matName] = {
                key: styleKeys[idx],
                label: styleOptions[idx]
            };
        }

        var marginPct = marginProp.Value;
        if (isNaN(marginPct) || marginPct < 0) marginPct = 0;

        // Обработка деталей
        var partsData = [];
        var totalEdgeLengths = {};
        for (var em = 0; em < edgeMaterialsList.length; em++) {
            totalEdgeLengths[edgeMaterialsList[em].name] = 0;
        }

        for (var i = 0; i < allPanels.length; i++) {
            var panel = allPanels[i];
            
            var rawW = panel.ContourWidth || panel.GSize.x || 0;
            var rawH = panel.ContourHeight || panel.GSize.y || 0;
            var rawTh = panel.Thickness || panel.GSize.z || 16;
            
            var dimW = Math.round(rawW * 10) / 10;
            var dimH = Math.round(rawH * 10) / 10;
            var thick = Math.round(rawTh * 10) / 10;

            // Определение ориентации: Длина и Ширина
            var lengthDim, widthDim, isLengthAlongX;
            var texDir = panel.TextureOrientation;
            
            if (texDir === 1) { // Horizontal / Along width
                lengthDim = dimW;
                widthDim = dimH;
                isLengthAlongX = true;
            } else if (texDir === 2) { // Vertical / Along height
                lengthDim = dimH;
                widthDim = dimW;
                isLengthAlongX = false;
            } else {
                // По стандарту: Длина >= Ширина
                if (dimW >= dimH) {
                    lengthDim = dimW;
                    widthDim = dimH;
                    isLengthAlongX = true;
                } else {
                    lengthDim = dimH;
                    widthDim = dimW;
                    isLengthAlongX = false;
                }
            }

            // Анализ торцов контура
            var lengthEdges = [];
            var widthEdges = [];

            if (panel.Contour && panel.Contour.Count >= 4) {
                for (var c = 0; c < panel.Contour.Count; c++) {
                    var elem = panel.Contour[c];
                    var dx = Math.abs(elem.Pos2.x - elem.Pos1.x);
                    var dy = Math.abs(elem.Pos2.y - elem.Pos1.y);
                    var elemLen = Math.sqrt(dx * dx + dy * dy);
                    var isHoriz = (dx >= dy);

                    // Ищем кромку на элементе c
                    var elemEdgeMat = null;
                    if (panel.Butts && panel.Butts.Count) {
                        for (var bIdx = 0; bIdx < panel.Butts.Count; bIdx++) {
                            var bObj = panel.Butts.Butts ? panel.Butts.Butts[bIdx] : panel.Butts[bIdx];
                            if (bObj && bObj.ElemIndex === c && bObj.Thickness > 0 && bObj.Material) {
                                elemEdgeMat = bObj.Material.trim();
                                break;
                            }
                        }
                    }

                    if (elemEdgeMat) {
                        // Суммируем метраж
                        if (totalEdgeLengths[elemEdgeMat] !== undefined) {
                            totalEdgeLengths[elemEdgeMat] += (elemLen / 1000.0);
                        } else {
                            totalEdgeLengths[elemEdgeMat] = (elemLen / 1000.0);
                        }
                    }

                    // Относим к длине или ширине
                    var belongsToLength = isLengthAlongX ? isHoriz : (!isHoriz);
                    if (belongsToLength) {
                        if (elemEdgeMat) lengthEdges.push(elemEdgeMat);
                    } else {
                        if (elemEdgeMat) widthEdges.push(elemEdgeMat);
                    }
                }
            }

            // Наименование и позиция
            var posStr = panel.ArtPos ? ('' + panel.ArtPos).trim() : '';
            var nameStr = panel.Name ? ('' + panel.Name).trim() : 'Деталь';
            var fullTitle = posStr ? ('Поз ' + posStr + ' (' + nameStr + ')') : nameStr;

            partsData.push({
                posStr: posStr,
                nameStr: nameStr,
                fullTitle: fullTitle,
                length: lengthDim,
                width: widthDim,
                thickness: thick,
                lengthEdges: lengthEdges,
                widthEdges: widthEdges,
                count: 1
            });
        }

        // Группировка одинаковых деталей
        var groupedParts = [];
        if (groupProp.Value) {
            var groupMap = {};
            for (var p = 0; p < partsData.length; p++) {
                var item = partsData[p];
                var lSort = item.lengthEdges.slice().sort().join('__');
                var wSort = item.widthEdges.slice().sort().join('__');
                var groupKey = [
                    item.fullTitle,
                    item.length,
                    item.width,
                    item.thickness,
                    lSort,
                    wSort
                ].join('###');

                if (groupMap[groupKey]) {
                    groupMap[groupKey].count += 1;
                } else {
                    var copy = {
                        posStr: item.posStr,
                        nameStr: item.nameStr,
                        fullTitle: item.fullTitle,
                        length: item.length,
                        width: item.width,
                        thickness: item.thickness,
                        lengthEdges: item.lengthEdges,
                        widthEdges: item.widthEdges,
                        count: 1
                    };
                    groupMap[groupKey] = copy;
                    groupedParts.push(copy);
                }
            }
        } else {
            groupedParts = partsData;
        }

        // Сортировка
        var sortMode = sortProp.ItemIndex;
        groupedParts.sort(function(a, b) {
            if (sortMode === 0) { // По позиции
                var numA = parseInt(a.posStr.replace(/\D/g, ''), 10) || 0;
                var numB = parseInt(b.posStr.replace(/\D/g, ''), 10) || 0;
                if (numA !== numB) return numB - numA; // По убыванию как на фото (Поз 21, 20, 19, 18, 13, 8...)
                return a.fullTitle.localeCompare(b.fullTitle);
            } else if (sortMode === 1) { // По длине
                if (b.length !== a.length) return b.length - a.length;
                return b.width - a.width;
            } else { // По наименованию
                return a.fullTitle.localeCompare(b.fullTitle);
            }
        });

        // Пересчет метража с учетом количества после группировки (если считали по 1 шт.)
        // totalEdgeLengths уже собран точно по всем панелям модели!

        if (isExcelExport) {
            exportToCSV(groupedParts, totalEdgeLengths, chosenStyles, marginPct);
            return;
        }

        // Формирование HTML
        generateHTMLReport(groupedParts, totalEdgeLengths, chosenStyles, marginPct);
    }

    function generateHTMLReport(parts, edgeTotals, styles, marginPct) {
        var modelName = 'Шкаф';
        if (Model.FileName) {
            var partsPath = Model.FileName.split('\\');
            modelName = partsPath[partsPath.length - 1];
        }

        var totalPartsCount = 0;
        for (var i = 0; i < parts.length; i++) {
            totalPartsCount += parts[i].count;
        }

        var now = new Date();
        var dateStr = ('0' + now.getDate()).slice(-2) + '.' + 
                      ('0' + (now.getMonth() + 1)).slice(-2) + '.' + 
                      now.getFullYear() + ' ' + 
                      ('0' + now.getHours()).slice(-2) + ':' + 
                      ('0' + now.getMinutes()).slice(-2);

        var html = [];
        html.push('<!DOCTYPE html>');
        html.push('<html lang="ru">');
        html.push('<head>');
        html.push('<meta charset="UTF-8">');
        html.push('<title>Ведомость деталей и кромления - ' + modelName + '</title>');
        html.push('<style>');
        html.push('@page { size: A4 portrait; margin: 10mm 10mm 10mm 10mm; }');
        html.push('body { font-family: "Segoe UI", Arial, sans-serif; background: #f4f6f8; margin: 20px; color: #111; }');
        html.push('@media print {');
        html.push('  body { background: #fff; margin: 0; }');
        html.push('  .no-print { display: none !important; }');
        html.push('  .container { box-shadow: none !important; border: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }');
        html.push('}');
        html.push('.container { max-width: 900px; margin: 0 auto; background: #fff; padding: 25px 30px; border-radius: 8px; box-shadow: 0 3px 15px rgba(0,0,0,0.08); border: 1px solid #e1e4e8; }');
        html.push('.btn-bar { display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 20px; }');
        html.push('.btn { background: #0066cc; color: #fff; border: none; padding: 9px 18px; font-size: 13.5px; font-weight: 600; border-radius: 5px; cursor: pointer; transition: 0.2s; }');
        html.push('.btn:hover { background: #004d99; }');
        html.push('.btn-copy { background: #28a745; }');
        html.push('.btn-copy:hover { background: #1e7e34; }');
        html.push('.title { text-align: center; font-size: 21px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }');
        html.push('.subtitle { text-align: center; font-size: 13px; color: #666; margin-bottom: 22px; }');
        
        // Сводная таблица кромок
        html.push('.summary-card { background: #fbfcfe; border: 1.5px solid #d0d7de; border-radius: 6px; padding: 14px 18px; margin-bottom: 22px; }');
        html.push('.summary-title { font-weight: bold; font-size: 14.5px; margin-bottom: 10px; color: #24292f; }');
        html.push('.summary-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }');
        html.push('.summary-table th, .summary-table td { border: 1px solid #d0d7de; padding: 7px 12px; text-align: left; }');
        html.push('.summary-table th { background: #f6f8fa; font-weight: 600; }');
        html.push('.legend-swatch { display: inline-flex; align-items: center; gap: 10px; }');
        html.push('.swatch-line { display: inline-block; width: 45px; height: 0; vertical-align: middle; }');

        // Основная таблица деталей
        html.push('table.parts-table { width: 100%; border-collapse: collapse; font-family: "ISOCPEUR", "Consolas", "Courier New", monospace; font-size: 15px; }');
        html.push('table.parts-table th, table.parts-table td { border: 1.5px solid #222; padding: 6px 10px; text-align: center; }');
        html.push('table.parts-table th { background: #ededed; font-weight: bold; font-size: 15px; letter-spacing: 0.5px; }');
        html.push('table.parts-table td.col-pos { text-align: left; font-family: "Segoe UI", Arial, sans-serif; font-size: 13.5px; }');
        html.push('table.parts-table tr.total-row { font-weight: bold; background: #fafafa; font-size: 15px; }');

        // Стили подчеркиваний кромок
        html.push('.cell-num { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 48px; padding: 1px 3px; }');
        html.push('.val-text { font-size: 16px; font-weight: bold; line-height: 1.25; }');
        html.push('.edge-lines-box { width: 100%; min-width: 42px; display: flex; flex-direction: column; gap: 2.5px; margin-top: 1.5px; }');
        html.push('.line-bar { width: 100%; display: block; }');
        html.push('.line-solid { border-bottom: 2.5px solid #000; }');
        html.push('.line-dashed { border-bottom: 2.5px dashed #000; }');
        html.push('.line-dotted { border-bottom: 3.5px dotted #000; }');
        html.push('.line-double { border-bottom: 3.5px double #000; }');
        html.push('.line-dashdot { border-bottom: 2.5px dashed #000; }');
        html.push('</style>');
        html.push('</head>');
        html.push('<body>');
        html.push('<div class="container">');
        
        // Кнопки
        html.push('<div class="btn-bar no-print">');
        html.push('<button class="btn" onclick="window.print()">🖨️ Печать / Сохранить в PDF</button>');
        html.push('<button class="btn btn-copy" onclick="copyTable()">📋 Скопировать для Excel</button>');
        html.push('</div>');

        // Заголовки
        html.push('<div class="title">Ведомость деталей и кромления</div>');
        html.push('<div class="subtitle">Модель: <strong>' + modelName + '</strong> | Дата формирования: ' + dateStr + '</div>');

        // Сводка по кромкам
        html.push('<div class="summary-card">');
        html.push('<div class="summary-title">Сводка необходимой кромки (запас: ' + marginPct + '%)</div>');
        html.push('<table class="summary-table">');
        html.push('<thead><tr><th>Кромочный материал</th><th>Обозначение в таблице</th><th>Чистая длина (м)</th><th>С учетом запаса ' + marginPct + '% (м)</th></tr></thead>');
        html.push('<tbody>');

        for (var em = 0; em < edgeMaterialsList.length; em++) {
            var emName = edgeMaterialsList[em].name;
            var emThick = edgeMaterialsList[em].thickness;
            var sInfo = styles[emName] || { key: 'solid', label: 'Сплошная линия' };
            var netMeters = edgeTotals[emName] || 0;
            var grossMeters = netMeters * (1.0 + marginPct / 100.0);

            html.push('<tr>');
            html.push('<td><strong>' + emName + '</strong> (' + emThick + ' мм)</td>');
            html.push('<td><span class="legend-swatch"><span class="swatch-line line-' + sInfo.key + '"></span><span>' + sInfo.label + '</span></span></td>');
            html.push('<td>' + netMeters.toFixed(2) + '</td>');
            html.push('<td><strong>' + grossMeters.toFixed(2) + '</strong></td>');
            html.push('</tr>');
        }

        html.push('</tbody></table></div>');

        // Основная таблица деталей
        html.push('<table class="parts-table" id="partsTable">');
        html.push('<thead>');
        html.push('<tr><th style="width: 50%;">Поз.</th><th style="width: 17%;">Длина</th><th style="width: 17%;">Ширина</th><th style="width: 16%;">Кол-во</th></tr>');
        html.push('</thead>');
        html.push('<tbody>');

        function renderDimensionCell(val, edgesArr) {
            var res = '<div class="cell-num"><span class="val-text">' + val + '</span>';
            if (edgesArr && edgesArr.length > 0) {
                res += '<div class="edge-lines-box">';
                for (var e = 0; e < edgesArr.length; e++) {
                    var mName = edgesArr[e];
                    var stKey = styles[mName] ? styles[mName].key : 'solid';
                    res += '<span class="line-bar line-' + stKey + '"></span>';
                }
                res += '</div>';
            }
            res += '</div>';
            return res;
        }

        for (var pIdx = 0; pIdx < parts.length; pIdx++) {
            var pt = parts[pIdx];
            html.push('<tr>');
            html.push('<td class="col-pos">' + pt.fullTitle + '</td>');
            html.push('<td>' + renderDimensionCell(pt.length, pt.lengthEdges) + '</td>');
            html.push('<td>' + renderDimensionCell(pt.width, pt.widthEdges) + '</td>');
            html.push('<td>' + pt.count + '</td>');
            html.push('</tr>');
        }

        html.push('<tr class="total-row">');
        html.push('<td class="col-pos"><strong>Итого</strong></td>');
        html.push('<td></td>');
        html.push('<td></td>');
        html.push('<td><strong>' + totalPartsCount + '</strong></td>');
        html.push('</tr>');

        html.push('</tbody></table>');
        html.push('</div>'); // container

        // JS для копирования
        html.push('<script>');
        html.push('function copyTable() {');
        html.push('  var tbl = document.getElementById("partsTable");');
        html.push('  var rows = [];');
        html.push('  for (var i = 0; i < tbl.rows.length; i++) {');
        html.push('    var r = tbl.rows[i];');
        html.push('    var cells = [];');
        html.push('    for (var j = 0; j < r.cells.length; j++) {');
        html.push('      cells.push(r.cells[j].innerText.trim().replace(/\\n/g, " "));');
        html.push('    }');
        html.push('    rows.push(cells.join("\\t"));');
        html.push('  }');
        html.push('  navigator.clipboard.writeText(rows.join("\\n")).then(function() {');
        html.push('    alert("Таблица скопирована в буфер обмена! Вы можете вставить ее в Excel (Ctrl+V).");');
        html.push('  });');
        html.push('}');
        html.push('</script>');

        html.push('</body></html>');

        var fullHtml = html.join('\n');

        // Сохранение файла
        var savePath = '';
        if (Model.FileName) {
            savePath = Model.FileName.replace(/\.[^/.]+$/, "") + "_ведомость_деталей.html";
        } else {
            savePath = 'C:\\Users\\maxim\\OneDrive\\Desktop\\Ведомость_деталей_и_кромления.html';
        }

        system.writeTextFile(savePath, fullHtml);

        // Открытие в браузере
        try {
            var sh = NewCOMObject('WScript.Shell');
            sh.Run('"' + savePath + '"');
        } catch (err) {
            system.exec('cmd.exe /c start "" "' + savePath + '"');
        }
    }

    function exportToCSV(parts, edgeTotals, styles, marginPct) {
        var csvLines = [];
        csvLines.push('Поз.;Длина;Ширина;Кол-во;Кромка_Длина;Кромка_Ширина');
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            var lEdges = p.lengthEdges.join(', ');
            var wEdges = p.widthEdges.join(', ');
            csvLines.push('"' + p.fullTitle + '";' + p.length + ';' + p.width + ';' + p.count + ';"' + lEdges + '";"' + wEdges + '"');
        }

        csvLines.push('');
        csvLines.push('СВОДКА КРОМКИ;Чистая_длина_м;Запас_' + marginPct + '%;Итого_м');
        for (var em = 0; em < edgeMaterialsList.length; em++) {
            var emName = edgeMaterialsList[em].name;
            var net = edgeTotals[emName] || 0;
            var gross = net * (1.0 + marginPct / 100.0);
            csvLines.push('"' + emName + '";' + net.toFixed(2) + ';' + marginPct + '%;' + gross.toFixed(2));
        }

        var csvPath = '';
        if (Model.FileName) {
            csvPath = Model.FileName.replace(/\.[^/.]+$/, "") + "_ведомость_деталей.csv";
        } else {
            csvPath = 'C:\\Users\\maxim\\OneDrive\\Desktop\\Ведомость_деталей_и_кромления.csv';
        }

        system.writeTextFile(csvPath, csvLines.join('\r\n'));
        alert('Файл CSV успешно сохранен:\n' + csvPath);
    }

    // Привязка кнопок
    btnMake.OnClick = function() {
        generateReport(false);
    };

    btnExcel.OnClick = function() {
        generateReport(true);
    };

    btnClose.OnClick = function() {
        Action.Finish();
    };

    // Автоматически генерируем отчет сразу при первом запуске!
    generateReport(false);

    Action.Continue();
})();
