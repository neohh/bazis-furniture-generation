# -*- coding: utf-8 -*-
import os, zipfile

script_js = r"""var H_TOTAL = 2660;
var D_THICK = 620;
var D_THIN  = 600;
var D_SHELF = 534;
var W_THICK_INNER = 828;
var W_THIN_INNER  = 1168;

function isFacade(p) {
    if (!p) return false;
    var nm = (p.Name || '').toLowerCase();
    if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || 
        nm.indexOf('створк') !== -1 || nm.indexOf('facade') !== -1 || nm.indexOf('door') !== -1) {
        return true;
    }
    // Фасады находятся спереди (Z > 200 мм) и стоят вертикально в плоскости XY
    var szZ = p.GabMax.z - p.GabMin.z;
    if (szZ <= 30 && p.GabMin.z > 200) {
        return true;
    }
    return false;
}

function enforceClipPanel(pan) {
    if (!pan || !pan.Butts) return 0;
    var cnt = 0;
    for (var b = 0; b < pan.Butts.Count; b++) {
        var butt = pan.Butts[b];
        if (butt) {
            try {
                butt.ClipPanel = true;
                cnt++;
            } catch(e) {}
        }
    }
    return cnt;
}

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
        newH = targetL >= targetW ? targetW : targetL;
    }
    pan.Contour.Fit(cMin.x, cMin.y, cMin.x + newW, cMin.y + newH);
}

function normalizeWardrobes() {
    var fixedCount = 0;
    var buttsFixed = 0;
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
        
        // ФАСАДЫ НЕ ТРОГАЕМ ВООБЩЕ!
        if (isFacade(p)) {
            continue;
        }
        
        var minX = p.GabMin.x, maxX = p.GabMax.x;
        var minY = p.GabMin.y, maxY = p.GabMax.y;
        var minZ = p.GabMin.z, maxZ = p.GabMax.z;
        
        var szX = maxX - minX;
        var szY = maxY - minY;
        var szZ = maxZ - minZ;
        
        var thick = Math.round(p.Thickness || Math.min(szX, Math.min(szY, szZ)));
        var is26 = (thick >= 22);
        var is16 = (thick < 22 && thick >= 12);
        
        var nm = (p.Name || 'Панель');
        
        // Включаем подрезку на всех существующих кромках детали
        buttsFixed += enforceClipPanel(p);
        
        // 1. ВЕРТИКАЛЬНЫЕ БОКОВИНЫ (YZ)
        if (szX <= 30 && szY > 1000) {
            if (is26) {
                // Толстый шкаф 26 мм: 2660 x 620
                fitContour(p, 2660, 620);
                p.PosY = 0;
                fixedCount++;
                report.push(nm + ' (26 мм): 2660x620');
            } else if (is16) {
                // Правый шкаф 16 мм: 2660 x 600
                fitContour(p, 2660, 600);
                p.PosY = 0;
                fixedCount++;
                report.push(nm + ' (16 мм): 2660x600');
            }
        }
        
        // 2. ГОРИЗОНТАЛЬНЫЕ ПАНЕЛИ (XZ: полки, дно, крышка)
        else if (szY <= 30 && (szX > 500 || szZ > 300)) {
            if (is26) {
                // Шкаф 1 (толстый): горизонты 828 x 620
                fitContour(p, 828, 620);
                if (minY < 1000) {
                    p.PosY = 600; // Высокое дно на 600 мм
                    report.push(nm + ' (Дно 26 мм): 828x620, Y=600');
                } else {
                    p.PosY = 2634; // Крышка под 2660
                    report.push(nm + ' (Крышка 26 мм): 828x620, Y=2634');
                }
                fixedCount++;
            } else if (is16) {
                // Шкаф 2 (16 мм): полки, дно, крышка 1168 x 534
                fitContour(p, 1168, 534);
                p.PosZ = 66; // Встык к заднику
                fixedCount++;
                report.push(nm + ' (Полка 16 мм): 1168x534, Z=66');
            }
        }
        
        // 3. ЗАДНИЕ СТЕНКИ И ЦОКОЛЬ (XY) - только сзади (Z <= 100)
        else if (szZ <= 30 && szX > 500 && minZ <= 100) {
            if (is26) {
                // Шкаф 1: Задник 26 мм -> 828 x 2008 в распор
                fitContour(p, 828, 2008);
                p.PosY = 626;
                p.PosX = 26;
                fixedCount++;
                report.push(nm + ' (Задник 26 мм): 828x2008, Y=626');
            } else if (is16) {
                if (szY < 150) {
                    // Цоколь 16 мм: 1168 x 60
                    fitContour(p, 1168, 60);
                    fixedCount++;
                    report.push(nm + ' (Цоколь): 1168x60');
                } else {
                    // Задняя стенка 16 мм: 1168 x 2568
                    fitContour(p, 1168, 2568);
                    p.PosY = 76;
                    p.PosZ = 50;
                    fixedCount++;
                    report.push(nm + ' (Задник 16 мм): 1168x2568');
                }
            }
        }
        
        if (p.Build) {
            try { p.Build(); } catch(eB) {}
        }
    }
    
    Action.Commit();
    
    var msg = 'Нормализация завершена!\nИсправлено каркасных деталей: ' + fixedCount + 
              '\nКромок переведено в подрезку (ClipPanel): ' + buttsFixed + 
              '\nФасады: НЕ ЗАТРОНУТЫ (пропущены)\n\n' + report.slice(0, 15).join('\n');
    if (report.length > 15) msg += '\n... и еще ' + (report.length - 15) + ' дет.';
    alert(msg);
}

normalizeWardrobes();
"""

def main():
    target_paths = [
        r"z:\Work\генерация мебели\scripts\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели\21_Нормализация_шкафов_по_чертежу_2080.js",
    ]
    
    encoded = script_js.encode('cp1251', errors='replace')
    for p in target_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'wb') as f:
            f.write(encoded)
        print(f"Written: {p}")
        
    zip_path = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ.zip"
    src_dir = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ"
    if os.path.exists(src_dir):
        print(f"Rebuilding {zip_path}...")
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(src_dir):
                for file in files:
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, src_dir)
                    zipf.write(full_p, rel_p)
        print("Zip rebuilt successfully!")

if __name__ == '__main__':
    main()
