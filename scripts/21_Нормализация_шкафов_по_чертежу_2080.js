var H_TOTAL = 2660;
var D_THICK = 620;
var D_THIN  = 600;
var D_SHELF = 534;
var W_THICK_INNER = 828;
var W_THIN_INNER  = 1168;

function fitContour(pan, targetL, targetW) {
    if (!pan || !pan.Contour || pan.Contour.Count === 0) return;
    var cMin = pan.Contour.Min;
    var cMax = pan.Contour.Max;
    var curW = cMax.x - cMin.x;
    var curH = cMax.y - cMin.y;
    
    var newW, newH;
    if (curW >= curH) {
        newW = targetL >= targetW ? targetL : targetW;
        newH = targetL >= targetW ? targetW : targetL;
    } else {
        newW = targetL >= targetW ? targetW : targetL;
        newH = targetL >= targetW ? targetL : targetW;
    }
    pan.Contour.Fit(cMin.x, cMin.y, cMin.x + newW, cMin.y + newH);
}

function normalizeWardrobes() {
    var fixedCount = 0;
    var report = [];
    
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
    
    var panels = [];
    extractPanels(Model, panels);
    
    for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        if (!p || !p.Contour) continue;
        
        var minX = p.GabMin.x, maxX = p.GabMax.x;
        var minY = p.GabMin.y, maxY = p.GabMax.y;
        var minZ = p.GabMin.z, maxZ = p.GabMax.z;
        
        var szX = maxX - minX;
        var szY = maxY - minY;
        var szZ = maxZ - minZ;
        
        var thick = Math.round(p.Thickness || Math.min(szX, Math.min(szY, szZ)));
        var is26 = (thick >= 22);
        var is16 = (thick < 22 && thick >= 12);
        
        var nm = (p.Name || '');
        
        // --- 1. ВЕРТИКАЛЬНЫЕ БОКОВИНЫ (YZ) ---
        if (szX <= 30 && szY > 1000) {
            if (is26) {
                // Шкаф 1 (толстый): 2660 x 620
                fitContour(p, 2660, 620);
                p.PosY = 0;
                fixedCount++;
                report.push(nm + ' (26 мм): -> 2660x620');
            } else if (is16) {
                // Шкаф 2 (16 мм): 2660 x 600
                fitContour(p, 2660, 600);
                p.PosY = 0;
                fixedCount++;
                report.push(nm + ' (16 мм): -> 2660x600');
            }
        }
        
        // --- 2. ГОРИЗОНТАЛЬНЫЕ ПАНЕЛИ (XZ: полки, дно, крышка) ---
        else if (szY <= 30 && (szX > 500 || szZ > 300)) {
            if (is26) {
                // Шкаф 1 (толстый): горизонты 828 x 620
                fitContour(p, 828, 620);
                if (minY < 1000) {
                    p.PosY = 600; // Высокое дно на 600 мм
                    report.push(nm + ' (Дно высокое 26 мм): -> 828x620, Y=600');
                } else {
                    p.PosY = 2634; // Крышка под 2660
                    report.push(nm + ' (Крышка 26 мм): -> 828x620, Y=2634');
                }
                fixedCount++;
            } else if (is16) {
                // Шкаф 2 (16 мм): полки, дно, крышка 1168 x 534
                fitContour(p, 1168, 534);
                p.PosZ = 66; // Встык к задней стенке 16 мм
                fixedCount++;
                report.push(nm + ' (Полка/горизонт 16 мм): -> 1168x534, Z=66');
            }
        }
        
        // --- 3. ФАСАДНЫЕ / ЗАДНИЕ СТЕНКИ (XY) ---
        else if (szZ <= 30 && szX > 500) {
            if (is26) {
                // Шкаф 1: Задняя стенка 26 мм -> 828 x 2008 в распор
                fitContour(p, 828, 2008);
                p.PosY = 626;
                p.PosX = 26;
                fixedCount++;
                report.push(nm + ' (Задник 26 мм): -> 828x2008, Y=626');
            } else if (is16) {
                if (szY < 150) {
                    // Цоколь 16 мм: 1168 x 60
                    fitContour(p, 1168, 60);
                    fixedCount++;
                    report.push(nm + ' (Цоколь): -> 1168x60');
                } else {
                    // Задняя стенка 16 мм: 1168 x 2568
                    fitContour(p, 1168, 2568);
                    p.PosY = 76;
                    fixedCount++;
                    report.push(nm + ' (Задник 16 мм): -> 1168x2568');
                }
            }
        }
        
        if (p.Build) {
            try { p.Build(); } catch(eB) {}
        }
    }
    
    var msg = 'Нормализация завершена!\nИсправлено деталей: ' + fixedCount + '\n\n' + report.slice(0, 15).join('\n');
    if (report.length > 15) msg += '\n... и еще ' + (report.length - 15) + ' дет.';
    alert(msg);
}

normalizeWardrobes();
