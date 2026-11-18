// 23_Умная_нормализация_кромки_и_размеров.js
// Назначение: Автоматически определяет, была ли деталь укорочена вручную, или нет.
// 1. Если размер детали дробный (например 2659.6, 2007.6) — возвращает контур к ровному
//    целому числу (2660.0, 2008.0) и включает подрезку кромки (ClipPanel = true).
// 2. Если размер детали уже ровный (например 600.0, 534.0, 184.0, 434.0) — контур НЕ трогает,
//    а просто включает подрезку кромки (ClipPanel = true).
// 3. Фасады (створки/двери) НЕ трогает, сохраняя их зазоры.
// 4. Работает с ВЫДЕЛЕННЫМИ панелями (если что-то выделено) или со ВСЕЙ моделью.

function isFacade(p) {
    if (!p) return false;
    var nm = (p.Name || '').toLowerCase();
    if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || 
        nm.indexOf('створк') !== -1 || nm.indexOf('facade') !== -1 || nm.indexOf('door') !== -1) {
        return true;
    }
    var szZ = p.GabMax.z - p.GabMin.z;
    if (szZ <= 30 && p.GabMin.z > 200) {
        return true;
    }
    return false;
}

function processPanel(pan) {
    if (!pan || !pan.Contour || pan.Contour.Count === 0) return null;
    if (isFacade(pan)) return null;
    
    var cMin = pan.Contour.Min;
    var cMax = pan.Contour.Max;
    var curW = cMax.x - cMin.x;
    var curH = cMax.y - cMin.y;
    
    var rW = Math.round(curW);
    var rH = Math.round(curH);
    
    // Проверяем наличие дробей (больше 0.05 мм)
    var needFixW = Math.abs(curW - rW) > 0.05;
    var needFixH = Math.abs(curH - rH) > 0.05;
    
    try { StartEditing(pan); } catch(e) {}
    
    var wasResized = false;
    if (needFixW || needFixH) {
        // Округляем контур до целого миллиметра
        pan.Contour.Fit(cMin.x, cMin.y, cMin.x + rW, cMin.y + rH);
        wasResized = true;
    }
    
    // Включаем ClipPanel = true на всех нанесенных кромках детали
    var buttsFixed = 0;
    if (pan.Butts && pan.Butts.Count > 0) {
        var buttsInfo = [];
        for (var b = 0; b < pan.Butts.Count; b++) {
            var bt = pan.Butts[b];
            if (bt) {
                buttsInfo.push({
                    mat: bt.Material,
                    elem: bt.ElemIndex
                });
            }
        }
        
        var inPlaceOk = true;
        for (var b = 0; b < pan.Butts.Count; b++) {
            try {
                pan.Butts[b].ClipPanel = true;
                buttsFixed++;
            } catch(e) {
                inPlaceOk = false;
                break;
            }
        }
        
        if (!inPlaceOk && buttsInfo.length > 0) {
            pan.Butts.Clear();
            buttsFixed = 0;
            for (var k = 0; k < buttsInfo.length; k++) {
                try {
                    var nb = pan.AddButt(buttsInfo[k].mat, buttsInfo[k].elem);
                    if (nb) {
                        nb.ClipPanel = true;
                        buttsFixed++;
                    }
                } catch(eAdd) {}
            }
        }
    }
    
    try { pan.Build(); } catch(eB) {}
    
    return {
        name: pan.Name || 'Панель',
        oldSize: curW.toFixed(1) + ' x ' + curH.toFixed(1),
        newSize: rW + ' x ' + rH,
        wasResized: wasResized,
        buttsFixed: buttsFixed
    };
}

function run() {
    var targets = [];
    
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
    
    var isSelectedOnly = (Model.SelectionCount > 0);
    if (isSelectedOnly) {
        for (var s = 0; s < Model.SelectionCount; s++) {
            extractPanels(Model.Selections[s], targets);
        }
    } else {
        extractPanels(Model, targets);
    }
    
    var totalProcessed = 0;
    var totalResized = 0;
    var totalButts = 0;
    var report = [];
    
    for (var i = 0; i < targets.length; i++) {
        var res = processPanel(targets[i]);
        if (!res) continue;
        
        totalProcessed++;
        totalButts += res.buttsFixed;
        
        if (res.wasResized) {
            totalResized++;
            report.push(res.name + ': ' + res.oldSize + ' -> ' + res.newSize + ' (исправлена дробь)');
        } else if (res.buttsFixed > 0) {
            report.push(res.name + ': размер ' + res.newSize + ' (контур не менялся, подрезка включена)');
        }
    }
    
    try { Action.Commit(); } catch(eC) {}
    
    var modeStr = isSelectedOnly ? 'Выделенные детали' : 'Вся модель';
    var msg = 'Готово! (' + modeStr + ')\n' +
              'Обработано панелей: ' + totalProcessed + '\n' +
              'Устранено дробей в размерах: ' + totalResized + '\n' +
              'Включена подрезка на кромках: ' + totalButts + '\n' +
              'Фасады: пропущены без изменений\n\n' +
              'Детали:\n' + report.slice(0, 20).join('\n');
              
    if (report.length > 20) msg += '\n... и еще ' + (report.length - 20) + ' дет.';
    alert(msg);
}

run();
