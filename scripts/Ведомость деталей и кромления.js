// =============================================================================
// Базис-Мебельщик: Скрипт формирования ведомости деталей и кромления
// Версия 2.5: Скачивание в PNG, альбомная/книжная ориентация, компактность
// =============================================================================

(function() {
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

    edgeMaterialsList.sort(function(a, b) {
        return b.thickness - a.thickness;
    });

    var styleOptions = [
        'Сплошная линия (----)',
        'Пунктирная линия (- - - -)',
        'Точечная линия (. . . . .)',
        'Двойная сплошная (====)',
        'Штрихпунктирная (- . - .)'
    ];

    var styleKeys = ['solid', 'dashed', 'dotted', 'double', 'dashdot'];

    var prop = Action.Properties;
    prop.Clear();

    var grEdges = prop.NewGroup('Обозначение кромок в таблице');
    var edgeStyleSelectors = {};

    for (var m = 0; m < edgeMaterialsList.length; m++) {
        var matObj = edgeMaterialsList[m];
        var defaultIdx = m % styleKeys.length;
        var combo = grEdges.NewCombo(matObj.name + ' (' + matObj.thickness + ' мм)', styleOptions.join('\n'));
        combo.ItemIndex = defaultIdx;
        edgeStyleSelectors[matObj.name] = combo;
    }

    var grParams = prop.NewGroup('Параметры таблицы');
    var marginProp = grParams.NewNumber('Запас на кромку (%)', 5);
    var groupProp = grParams.NewBool('Группировать одинаковые', true);
    var smartGroupProp = grParams.NewBool('Умное объединение полок (1, 2...)', true);
    var sortProp = grParams.NewCombo('Сортировка деталей', 'По позиции (Поз. 1, 2...)\nПо длине (убывание)\nПо наименованию');
    sortProp.ItemIndex = 0;

    var grActions = prop.NewGroup('Действия');
    var btnMake = grActions.NewButton('Сформировать ведомость (HTML)');
    var btnExcel = grActions.NewButton('Экспорт в Excel (CSV)');
    var btnClose = grActions.NewButton('Закрыть');

    function generateReport(isExcelExport) {
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

            var lengthDim, widthDim, isLengthAlongX;
            var texDir = panel.TextureOrientation;
            
            if (texDir === 1) {
                lengthDim = dimW;
                widthDim = dimH;
                isLengthAlongX = true;
            } else if (texDir === 2) {
                lengthDim = dimH;
                widthDim = dimW;
                isLengthAlongX = false;
            } else {
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

            var lengthEdges = [];
            var widthEdges = [];

            if (panel.Contour && panel.Contour.Count >= 4) {
                for (var c = 0; c < panel.Contour.Count; c++) {
                    var elem = panel.Contour[c];
                    var dx = Math.abs(elem.Pos2.x - elem.Pos1.x);
                    var dy = Math.abs(elem.Pos2.y - elem.Pos1.y);
                    var elemLen = Math.sqrt(dx * dx + dy * dy);
                    var isHoriz = (dx >= dy);

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
                        if (totalEdgeLengths[elemEdgeMat] !== undefined) {
                            totalEdgeLengths[elemEdgeMat] += (elemLen / 1000.0);
                        } else {
                            totalEdgeLengths[elemEdgeMat] = (elemLen / 1000.0);
                        }
                    }

                    var belongsToLength = isLengthAlongX ? isHoriz : (!isHoriz);
                    if (belongsToLength) {
                        if (elemEdgeMat) lengthEdges.push(elemEdgeMat);
                    } else {
                        if (elemEdgeMat) widthEdges.push(elemEdgeMat);
                    }
                }
            }

            var posStr = panel.ArtPos ? ('' + panel.ArtPos).trim() : '';
            var nameStr = panel.Name ? ('' + panel.Name).trim() : 'Деталь';
            var baseName = nameStr.replace(/\s*\d+$/, '');
            
            var fullTitle = posStr ? ('Поз ' + posStr + ' (' + nameStr + ')') : nameStr;
            var cleanTitle = posStr ? ('Поз ' + posStr + ' (' + baseName + ')') : baseName;

            partsData.push({
                posStr: posStr,
                nameStr: nameStr,
                baseName: baseName,
                fullTitle: fullTitle,
                cleanTitle: cleanTitle,
                length: lengthDim,
                width: widthDim,
                thickness: thick,
                lengthEdges: lengthEdges,
                widthEdges: widthEdges,
                count: 1
            });
        }

        if (isExcelExport) {
            exportToCSV(partsData, totalEdgeLengths, chosenStyles, marginPct);
            return;
        }

        generateHTMLReport(partsData, totalEdgeLengths, chosenStyles, marginPct, smartGroupProp.Value);
    }

    function generateHTMLReport(rawParts, edgeTotals, styles, marginPct, initialSmartGroup) {
        var modelName = 'Шкаф';
        if (Model.FileName) {
            var partsPath = Model.FileName.split('\\');
            modelName = partsPath[partsPath.length - 1];
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
        html.push('<meta charset="windows-1251">');
        html.push('<title>Ведомость деталей и кромления - ' + modelName + '</title>');
        html.push('<script src="html2canvas.min.js"></script>');
        html.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>');
        
        html.push('<style id="printOrientationStyle">');
        html.push('@page { size: landscape; margin: 8mm; }');
        html.push('</style>');

        html.push('<style>');
        html.push('body { font-family: "Segoe UI", Arial, sans-serif; background: #eef1f5; margin: 15px auto; color: #111; }');
        html.push('@media print {');
        html.push('  body { background: #fff !important; margin: 0 !important; }');
        html.push('  .no-print { display: none !important; }');
        html.push('  .page-box { box-shadow: none !important; border: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }');
        html.push('}');
        
        html.push('.toolbar { max-width: 1100px; margin: 0 auto 15px auto; background: #1e293b; color: #fff; padding: 10px 16px; border-radius: 8px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); }');
        html.push('.tb-group { display: flex; align-items: center; gap: 6px; }');
        html.push('.tb-label { font-size: 12.5px; color: #cbd5e1; font-weight: 500; }');
        html.push('.tb-btn { background: #334155; color: #fff; border: 1px solid #475569; padding: 6px 12px; font-size: 12.5px; font-weight: 600; border-radius: 5px; cursor: pointer; transition: 0.15s; user-select: none; }');
        html.push('.tb-btn:hover { background: #475569; }');
        html.push('.tb-btn.active { background: #0284c7; border-color: #38bdf8; }');
        html.push('.tb-btn-png { background: #7c3aed; border-color: #6d28d9; color: #fff; font-weight: bold; }');
        html.push('.tb-btn-png:hover { background: #6d28d9; }');
        html.push('.tb-btn-primary { background: #0284c7; border-color: #0284c7; }');
        html.push('.tb-btn-primary:hover { background: #0369a1; }');
        html.push('.tb-btn-success { background: #16a34a; border-color: #16a34a; }');
        html.push('.tb-btn-success:hover { background: #15803d; }');
        html.push('.tb-btn-preset { background: #d97706; border-color: #f59e0b; color: #fff; font-weight: bold; }');
        html.push('.tb-btn-preset:hover { background: #b45309; }');

        html.push('.page-box { max-width: 1100px; margin: 0 auto; background: #fff; padding: 16px 22px; border-radius: 8px; box-shadow: 0 3px 15px rgba(0,0,0,0.08); border: 1px solid #e1e4e8; transition: max-width 0.2s ease; transform-origin: top center; }');
        html.push('.title-bar { text-align: center; margin-bottom: 10px; }');
        html.push('.title { font-size: 18.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }');
        html.push('.subtitle { font-size: 12px; color: #666; margin-top: 2px; }');

        html.push('.summary-card { background: #fbfcfe; border: 1px solid #d0d7de; border-radius: 5px; padding: 7px 12px; margin-bottom: 10px; }');
        html.push('.summary-title { font-weight: bold; font-size: 13px; margin-bottom: 5px; color: #24292f; }');
        html.push('.summary-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }');
        html.push('.summary-table th, .summary-table td { border: 1px solid #d0d7de; padding: 4px 8px; text-align: left; }');
        html.push('.summary-table th { background: #f6f8fa; font-weight: 600; }');
        html.push('.legend-swatch { display: inline-flex; align-items: center; gap: 8px; }');
        html.push('.swatch-line { display: inline-block; width: 40px; height: 0; vertical-align: middle; }');

        html.push('table.parts-table { width: 100%; border-collapse: collapse; font-family: "ISOCPEUR", "Consolas", "Courier New", monospace; font-size: 14.5px; }');
        html.push('table.parts-table th, table.parts-table td { border: 1.5px solid #222; padding: 4.5px 7px; text-align: center; }');
        html.push('table.parts-table th { background: #ededed; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; }');
        html.push('table.parts-table td.col-pos { text-align: left; font-family: "Segoe UI", Arial, sans-serif; font-size: 13px; }');
        html.push('table.parts-table tr.total-row { font-weight: bold; background: #fafafa; font-size: 14.5px; }');

        html.push('.cell-num { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; min-width: 44px; padding: 1px 2px; }');
        html.push('.val-text { font-size: 15.5px; font-weight: bold; line-height: 1.25; }');
        html.push('.edge-lines-box { width: 100%; min-width: 38px; display: flex; flex-direction: column; gap: 2px; margin-top: 1.5px; }');
        html.push('.line-bar { width: 100%; display: block; }');
        html.push('.line-solid { border-bottom: 2.5px solid #000; }');
        html.push('.line-dashed { border-bottom: 2.5px dashed #000; }');
        html.push('.line-dotted { border-bottom: 3.5px dotted #000; }');
        html.push('.line-double { border-bottom: 3.5px double #000; }');
        html.push('.line-dashdot { border-bottom: 2.5px dashed #000; }');

        html.push('.density-compact table.parts-table th, .density-compact table.parts-table td { padding: 2.5px 5px !important; }');
        html.push('.density-compact .val-text { font-size: 14px !important; }');
        html.push('.density-compact .col-pos { font-size: 12px !important; }');
        html.push('.density-compact .edge-lines-box { gap: 1.5px !important; margin-top: 1px !important; }');

        html.push('.density-ultra table.parts-table th, .density-ultra table.parts-table td { padding: 1.5px 4px !important; }');
        html.push('.density-ultra .val-text { font-size: 13px !important; }');
        html.push('.density-ultra .col-pos { font-size: 11px !important; }');

        html.push('.cols-flex-wrapper { display: flex; gap: 12px; width: 100%; align-items: flex-start; }');
        html.push('.col-half { flex: 1; min-width: 0; }');
        html.push('</style>');
        html.push('</head>');
        html.push('<body>');

        html.push('<div class="toolbar no-print">');
        
        html.push('<div class="tb-group">');
        html.push('<button class="tb-btn tb-btn-png" onclick="downloadPNG()" title="Сохранить всю таблицу как картинку PNG">&#128247; Скачать как PNG</button>');
        html.push('<button class="tb-btn tb-btn-primary" onclick="window.print()">Печать / Экспорт в PDF</button>');
        html.push('<button class="tb-btn tb-btn-success" onclick="copyTable()">Копировать для Excel</button>');
        html.push('</div>');

        html.push('<div class="tb-group">');
        html.push('<span class="tb-label">Ориентация:</span>');
        html.push('<button id="btnOrientLandscape" class="tb-btn active" onclick="setOrientation(true)">Альбомная (А4)</button>');
        html.push('<button id="btnOrientPortrait" class="tb-btn" onclick="setOrientation(false)">Книжная</button>');
        html.push('</div>');

        html.push('<div class="tb-group">');
        html.push('<span class="tb-label">Вид:</span>');
        html.push('<button id="btnCol2" class="tb-btn active" onclick="setColumns(2)">2 колонки</button>');
        html.push('<button id="btnCol1" class="tb-btn" onclick="setColumns(1)">1 колонка</button>');
        html.push('</div>');

        html.push('<div class="tb-group">');
        html.push('<span class="tb-label">Плотность:</span>');
        html.push('<button id="btnDensity" class="tb-btn" onclick="cycleDensity()">Компактная</button>');
        html.push('</div>');

        html.push('<div class="tb-group">');
        html.push('<span class="tb-label">Масштаб:</span>');
        html.push('<button class="tb-btn" onclick="changeZoom(-5)">-</button>');
        html.push('<span id="zoomLabel" style="font-weight:bold; font-size:12.5px; min-width:38px; text-align:center;">100%</span>');
        html.push('<button class="tb-btn" onclick="changeZoom(+5)">+</button>');
        html.push('</div>');

        html.push('<div class="tb-group">');
        html.push('<label class="tb-label" style="cursor:pointer;"><input type="checkbox" id="chkSmartGroup" checked onchange="toggleSmartGroup(this.checked)"> Умное объединение полок</label>');
        html.push('</div>');

        html.push('</div>'); // .toolbar

        html.push('<div class="page-box density-compact" id="pageBox">');
        html.push('<div class="title-bar">');
        html.push('<h1 class="title">Ведомость деталей и кромления</h1>');
        html.push('<div class="subtitle">Модель: <strong>' + modelName + '</strong> | Дата: ' + dateStr + '</div>');
        html.push('</div>');

        html.push('<div class="summary-card" id="summaryCard">');
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

        html.push('<div id="tableMount"></div>');
        html.push('</div>'); // .page-box

        var jsonRaw = JSON.stringify(rawParts);
        var jsonStyles = JSON.stringify(styles);

        html.push('<script>');
        html.push('var rawData = ' + jsonRaw + ';');
        html.push('var stylesMap = ' + jsonStyles + ';');
        html.push('var currentCols = 2;');
        html.push('var currentDensity = 1;');
        html.push('var currentZoom = 100;');
        html.push('var isSmartGroup = true;');
        html.push('var isLandscape = true;');

        html.push('function getGroupedData(smart) {');
        html.push('  var map = {}; var res = [];');
        html.push('  for (var i = 0; i < rawData.length; i++) {');
        html.push('    var item = rawData[i];');
        html.push('    var title = smart ? item.cleanTitle : item.fullTitle;');
        html.push('    var lS = item.lengthEdges.slice().sort().join("__");');
        html.push('    var wS = item.widthEdges.slice().sort().join("__");');
        html.push('    var key = [title, item.length, item.width, item.thickness, lS, wS].join("###");');
        html.push('    if (map[key]) { map[key].count++; } else {');
        html.push('      var c = { fullTitle: title, posStr: item.posStr, length: item.length, width: item.width, thickness: item.thickness, lengthEdges: item.lengthEdges, widthEdges: item.widthEdges, count: 1 };');
        html.push('      map[key] = c; res.push(c);');
        html.push('    }');
        html.push('  }');
        html.push('  res.sort(function(a, b) {');
        html.push('    var nA = parseInt(a.posStr.replace(/\\D/g, ""), 10) || 0;');
        html.push('    var nB = parseInt(b.posStr.replace(/\\D/g, ""), 10) || 0;');
        html.push('    if (nA !== nB) return nB - nA;');
        html.push('    return a.fullTitle.localeCompare(b.fullTitle);');
        html.push('  });');
        html.push('  return res;');
        html.push('}');

        html.push('function renderDim(val, edges) {');
        html.push('  var s = "<div class=\'cell-num\'><span class=\'val-text\'>" + val + "</span>";');
        html.push('  if (edges && edges.length > 0) {');
        html.push('    s += "<div class=\'edge-lines-box\'>";');
        html.push('    for (var i = 0; i < edges.length; i++) {');
        html.push('      var st = stylesMap[edges[i]] ? stylesMap[edges[i]].key : "solid";');
        html.push('      s += "<span class=\'line-bar line-" + st + "\'></span>";');
        html.push('    }');
        html.push('    s += "</div>";');
        html.push('  }');
        html.push('  s += "</div>";');
        html.push('  return s;');
        html.push('}');

        html.push('function buildTableHtml(items, startIdx, showTotal, totalSum) {');
        html.push('  var h = "<table class=\'parts-table\'>";');
        html.push('  h += "<thead><tr><th style=\'width:48%;\'>Поз.</th><th style=\'width:18%;\'>Длина</th><th style=\'width:18%;\'>Ширина</th><th style=\'width:16%;\'>Кол-во</th></tr></thead><tbody>";');
        html.push('  for (var i = 0; i < items.length; i++) {');
        html.push('    var it = items[i];');
        html.push('    h += "<tr><td class=\'col-pos\'>" + it.fullTitle + "</td><td>" + renderDim(it.length, it.lengthEdges) + "</td><td>" + renderDim(it.width, it.widthEdges) + "</td><td>" + it.count + "</td></tr>";');
        html.push('  }');
        html.push('  if (showTotal) {');
        html.push('    h += "<tr class=\'total-row\'><td class=\'col-pos\'><strong>Итого</strong></td><td></td><td></td><td><strong>" + totalSum + "</strong></td></tr>";');
        html.push('  }');
        html.push('  h += "</tbody></table>";');
        html.push('  return h;');
        html.push('}');

        html.push('function render() {');
        html.push('  var data = getGroupedData(isSmartGroup);');
        html.push('  var total = 0; for (var k = 0; k < data.length; k++) total += data[k].count;');
        html.push('  var mount = document.getElementById("tableMount");');
        html.push('  if (currentCols === 1) {');
        html.push('    mount.innerHTML = buildTableHtml(data, 0, true, total);');
        html.push('  } else {');
        html.push('    var mid = Math.ceil(data.length / 2);');
        html.push('    var left = data.slice(0, mid);');
        html.push('    var right = data.slice(mid);');
        html.push('    var out = "<div class=\'cols-flex-wrapper\'>";');
        html.push('    out += "<div class=\'col-half\'>" + buildTableHtml(left, 0, false, 0) + "</div>";');
        html.push('    out += "<div class=\'col-half\'>" + buildTableHtml(right, mid, true, total) + "</div>";');
        html.push('    out += "</div>";');
        html.push('    mount.innerHTML = out;');
        html.push('  }');
        html.push('}');

        html.push('function setColumns(c) {');
        html.push('  currentCols = c;');
        html.push('  document.getElementById("btnCol1").className = "tb-btn" + (c === 1 ? " active" : "");');
        html.push('  document.getElementById("btnCol2").className = "tb-btn" + (c === 2 ? " active" : "");');
        html.push('  render();');
        html.push('}');

        html.push('function setOrientation(landscape) {');
        html.push('  isLandscape = landscape;');
        html.push('  document.getElementById("btnOrientLandscape").className = "tb-btn" + (landscape ? " active" : "");');
        html.push('  document.getElementById("btnOrientPortrait").className = "tb-btn" + (!landscape ? " active" : "");');
        html.push('  var st = document.getElementById("printOrientationStyle");');
        html.push('  var box = document.getElementById("pageBox");');
        html.push('  if (landscape) {');
        html.push('    st.innerHTML = "@page { size: landscape; margin: 8mm; }";');
        html.push('    box.style.maxWidth = "1100px";');
        html.push('    setColumns(2);');
        html.push('  } else {');
        html.push('    st.innerHTML = "@page { size: portrait; margin: 8mm; }";');
        html.push('    box.style.maxWidth = "880px";');
        html.push('    setColumns(1);');
        html.push('  }');
        html.push('}');

        html.push('function cycleDensity() {');
        html.push('  currentDensity = (currentDensity + 1) % 3;');
        html.push('  applyDensity();');
        html.push('}');

        html.push('function applyDensity() {');
        html.push('  var box = document.getElementById("pageBox");');
        html.push('  box.classList.remove("density-compact", "density-ultra");');
        html.push('  var b = document.getElementById("btnDensity");');
        html.push('  if (currentDensity === 1) { box.classList.add("density-compact"); b.innerText = "Компактная"; }');
        html.push('  else if (currentDensity === 2) { box.classList.add("density-ultra"); b.innerText = "Ультра"; }');
        html.push('  else { b.innerText = "Обычная"; }');
        html.push('}');

        html.push('function changeZoom(delta) {');
        html.push('  currentZoom = Math.max(60, Math.min(130, currentZoom + delta));');
        html.push('  applyZoom();');
        html.push('}');

        html.push('function applyZoom() {');
        html.push('  document.getElementById("zoomLabel").innerText = currentZoom + "%";');
        html.push('  var box = document.getElementById("pageBox");');
        html.push('  box.style.zoom = (currentZoom / 100);');
        html.push('}');

        html.push('function toggleSmartGroup(val) {');
        html.push('  isSmartGroup = val;');
        html.push('  render();');
        html.push('}');

        html.push('function downloadPNG() {');
        html.push('  var box = document.getElementById("pageBox");');
        html.push('  var prevZoom = box.style.zoom;');
        html.push('  box.style.zoom = 1;');
        html.push('  function doCapture() {');
        html.push('    html2canvas(box, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false }).then(function(canvas) {');
        html.push('      box.style.zoom = prevZoom;');
        html.push('      canvas.toBlob(function(blob) {');
        html.push('        var url = URL.createObjectURL(blob);');
        html.push('        var link = document.createElement("a");');
        html.push('        link.download = "Ведомость_деталей_кромления.png";');
        html.push('        link.href = url;');
        html.push('        document.body.appendChild(link);');
        html.push('        link.click();');
        html.push('        setTimeout(function() { document.body.removeChild(link); URL.revokeObjectURL(url); }, 200);');
        html.push('      }, "image/png");');
        html.push('    }).catch(function(err) {');
        html.push('      box.style.zoom = prevZoom;');
        html.push('      alert("Ошибка при создании PNG: " + err);');
        html.push('    });');
        html.push('  }');
        html.push('  if (typeof html2canvas === "undefined") {');
        html.push('    var s = document.createElement("script");');
        html.push('    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";');
        html.push('    s.onload = doCapture;');
        html.push('    s.onerror = function() { box.style.zoom = prevZoom; alert("Не удалось загрузить библиотеку сохранения PNG."); };');
        html.push('    document.head.appendChild(s);');
        html.push('  } else { doCapture(); }');
        html.push('}');

        html.push('function copyTable() {');
        html.push('  var data = getGroupedData(isSmartGroup);');
        html.push('  var total = 0; for (var k = 0; k < data.length; k++) total += data[k].count;');
        html.push('  var rows = ["Поз.\\tДлина\\tШирина\\tКол-во"];');
        html.push('  for (var i = 0; i < data.length; i++) {');
        html.push('    rows.push(data[i].fullTitle + "\\t" + data[i].length + "\\t" + data[i].width + "\\t" + data[i].count);');
        html.push('  }');
        html.push('  rows.push("Итого\\t\\t\\t" + total);');
        html.push('  navigator.clipboard.writeText(rows.join("\\n")).then(function() {');
        html.push('    alert("Таблица скопирована в буфер обмена для Excel (Ctrl+V)!");');
        html.push('  });');
        html.push('}');

        html.push('render();');
        html.push('applyDensity();');
        html.push('applyZoom();');
        html.push('</script>');
        html.push('</body></html>');

        var fullHtml = html.join('\n');

        var savePath = '';
        if (Model.FileName) {
            savePath = Model.FileName.replace(/\.[^/.]+$/, "") + "_ведомость_деталей.html";
        } else {
            savePath = 'C:\\Users\\maxim\\OneDrive\\Desktop\\Ведомость_деталей_и_кромления.html';
        }

        system.writeTextFile(savePath, fullHtml);

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

    btnMake.OnClick = function() {
        generateReport(false);
    };

    btnExcel.OnClick = function() {
        generateReport(true);
    };

    btnClose.OnClick = function() {
        Action.Finish();
    };

    generateReport(false);
    Action.Continue();
})();
