# -*- coding: utf-8 -*-
import os, zipfile

script_js = r"""// 24_Точечная_подгонка_боковин_полок_и_задника.js
// Исправляет ровно 3 замеченные вами проблемы:
// 1. Боковины: делает высоту строго 2660 мм (убирает нехватку 1 мм: 2659 -> 2660).
// 2. Полки: делает глубину строго 534 мм (убирает нехватку 1 мм: 533 -> 534).
// 3. Задняя стенка ЛДСП 26 мм: ставит размер 828 x 2008 мм в распор между дном (Y=626) и крышкой (Y=2634).
// Все остальные панели, фасады и стойки НЕ ТРОГАЕТ!

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

function run() {
    var fixedSides = 0;
    var fixedShelves = 0;
    var fixedBack = 0;
    var report = [];
    
    function scan(obj) {
        if (!obj) return;
        if (obj.AsPanel) {
            var p = obj.AsPanel;
            var nm = (p.Name || '').toLowerCase();
            
            // Пропускаем фасады
            if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('створк') !== -1) return;
            
            var cMin = p.Contour.Min;
            var cMax = p.Contour.Max;
            var cL = Math.max(cMax.x - cMin.x, cMax.y - cMin.y);
            var cW = Math.min(cMax.x - cMin.x, cMax.y - cMin.y);
            
            // 1. Боковины (высота около 2659..2660)
            if (nm.indexOf('боковина') !== -1 && cL >= 2650 && cL <= 2665) {
                var depth = Math.round(cW);
                // Для толстого шкафа глубина 620, для тонкого 600
                if (depth < 610) depth = 600; else depth = 620;
                
                fitContour(p, 2660, depth);
                p.PosY = 0;
                fixedSides++;
                report.push(p.Name + ': высота выровнена на 2660 мм (было ' + cL.toFixed(1) + ')');
            }
            
            // 2. Полки (глубина около 533..534, ширина ~1168)
            else if (nm.indexOf('полка') !== -1 && cW >= 530 && cW <= 536) {
                fitContour(p, 1168, 534);
                p.PosZ = 66; // вплотную к задней стенке 16 мм
                fixedShelves++;
                report.push(p.Name + ': глубина выровнена на 534 мм (было ' + cW.toFixed(1) + ')');
            }
            
            // 3. Задняя стенка ЛДСП 26 мм (если высота 2634 мм -> делаем 2008 мм в распор)
            else if (nm.indexOf('задняя') !== -1 && (nm.indexOf('26') !== -1 || p.Thickness >= 22)) {
                if (cL > 2100) {
                    fitContour(p, 828, 2008);
                    p.PosY = 626; // От верха высокого дна
                    p.PosX = 26;
                    fixedBack++;
                    report.push(p.Name + ': высота исправлена с ' + cL.toFixed(1) + ' на 2008 мм (между дном и крышкой)');
                }
            }
            
            // Проверяем кромку: оставляем ClipPanel = true
            if (p.Butts) {
                for (var b = 0; b < p.Butts.Count; b++) {
                    try { p.Butts[b].ClipPanel = true; } catch(e) {}
                }
            }
            if (p.Build) {
                try { p.Build(); } catch(eB) {}
            }
        }
        else if (obj.Count && obj.Count > 0) {
            for (var i = 0; i < obj.Count; i++) {
                var child = obj.Objects ? obj.Objects[i] : obj[i];
                scan(child);
            }
        }
    }
    
    scan(Model);
    try { Action.Commit(); } catch(eC) {}
    
    var msg = 'Точечная подгонка завершена!\n\n' +
              '• Исправлено боковин (на 2660 мм): ' + fixedSides + '\n' +
              '• Исправлено полок (на 534 мм): ' + fixedShelves + '\n' +
              '• Исправлено задников (на 2008 мм): ' + fixedBack + '\n\n' +
              'Детали:\n' + report.join('\n');
    alert(msg);
}

run();
"""

def main():
    target_paths = [
        r"z:\Work\генерация мебели\scripts\24_Точечная_подгонка_боковин_полок_и_задника.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\24_Точечная_подгонка_боковин_полок_и_задника.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели\24_Точечная_подгонка_боковин_полок_и_задника.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\24_Точечная_подгонка_боковин_полок_и_задника.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели\24_Точечная_подгонка_боковин_полок_и_задника.js",
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
