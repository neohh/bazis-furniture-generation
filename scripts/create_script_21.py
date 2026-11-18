# -*- coding: utf-8 -*-
import os, zipfile, shutil

script_js = r"""// ==============================================================================
// Скрипт: 21_Нормализация_шкафов_по_чертежу_2080.js
// Назначение: Полный аудит и нормализация габаритов двух прилегающих шкафов
// (L = 2080 мм, H = 2660 мм) строго по чертежу-эскизу.
// 
// Устраняет искажения старой кромки:
//   - 601 мм -> 600 мм (боковины правого шкафа 16 мм)
//   - 621 мм -> 620 мм (боковины и горизонты толстого шкафа 26 мм)
//   - 2659.6 мм -> 2660.0 мм (высота всех боковин)
//   - 434 мм / 535 мм -> 534 мм (глубина полок правого шкафа)
//   - 2007.6 мм -> 2008.0 мм (задняя стенка 26 мм)
//   - Включает подрезку кромки (ClipPanel = true), чтобы размеры оставались целыми!
// ==============================================================================

var H_TOTAL = 2660;
var D_THICK = 620;  // Глубина толстого шкафа 26 мм
var D_THIN  = 600;  // Глубина правого шкафа 16 мм
var D_SHELF = 534;  // Глубина полок (600 - 50 отступ - 16 задник)
var W_THICK_INNER = 828;  // 880 - 26 - 26
var W_THIN_INNER  = 1168; // 1200 - 16 - 16

function normalizePanelContour(pan, targetL, targetW) {
    if (!pan || !pan.Contour) return;
    var c = pan.Contour;
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    
    for (var i = 0; i < c.Count; i++) {
        var el = c[i];
        if (el.Pos1) {
            if (el.Pos1.x < minX) minX = el.Pos1.x;
            if (el.Pos1.x > maxX) maxX = el.Pos1.x;
            if (el.Pos1.y < minY) minY = el.Pos1.y;
            if (el.Pos1.y > maxY) maxY = el.Pos1.y;
        }
        if (el.Pos2) {
            if (el.Pos2.x < minX) minX = el.Pos2.x;
            if (el.Pos2.x > maxX) maxX = el.Pos2.x;
            if (el.Pos2.y < minY) minY = el.Pos2.y;
            if (el.Pos2.y > maxY) maxY = el.Pos2.y;
        }
    }
    
    var curL = maxX - minX;
    var curW = maxY - minY;
    
    // Подгоняем контур через Fit
    if (targetL && targetW) {
        c.Fit(minX, minY, minX + targetL, minY + targetW);
    } else if (targetL) {
        c.Fit(minX, minY, minX + targetL, maxY);
    } else if (targetW) {
        c.Fit(minX, minY, maxX, minY + targetW);
    }
}

function processModel() {
    var fixedCount = 0;
    var report = [];
    
    function scanList(list) {
        for (var i = 0; i < list.Count; i++) {
            var obj = list[i];
            if (obj.List) {
                scanList(obj.List);
            }
            if (obj.AsPanel) {
                var p = obj.AsPanel;
                var name = (p.Name || '').toLowerCase();
                var mat = (p.MaterialName || '').toLowerCase();
                var thick = Math.round(p.Thickness || 16);
                
                // 1. Боковины толстого шкафа (26 мм): 2660 x 620
                if ((name.indexOf('боковина') !== -1 && (thick === 26 || mat.indexOf('26') !== -1 || name.indexOf('26') !== -1))) {
                    var oldH = p.GSize.y;
                    var oldD = p.GSize.z;
                    normalizePanelContour(p, 2660, 620);
                    // Выравниваем верхний срез на 2660
                    p.PosY = 0;
                    fixedCount++;
                    report.push(p.Name + ': высота ' + oldH.toFixed(1) + ' -> 2660, глубина ' + oldD.toFixed(1) + ' -> 620');
                }
                // 2. Боковины правого шкафа (16 мм): 2660 x 600
                else if (name.indexOf('боковина') !== -1 && thick === 16) {
                    var oldH = p.GSize.y;
                    var oldD = p.GSize.z;
                    normalizePanelContour(p, 2660, 600);
                    p.PosY = 0;
                    fixedCount++;
                    report.push(p.Name + ': высота ' + oldH.toFixed(1) + ' -> 2660, глубина ' + oldD.toFixed(1) + ' -> 600');
                }
                // 3. Дно высокое (26 мм): 828 x 620 на Y = 600
                else if (name.indexOf('дно') !== -1 && (thick === 26 || name.indexOf('высокое') !== -1)) {
                    var oldL = p.GSize.x;
                    var oldD = p.GSize.z;
                    normalizePanelContour(p, 828, 620);
                    p.PosY = 600;
                    fixedCount++;
                    report.push(p.Name + ': ' + oldL.toFixed(1) + 'x' + oldD.toFixed(1) + ' -> 828x620, Y=600');
                }
                // 4. Крышка толстого шкафа (26 мм): 828 x 620 на Y = 2634
                else if (name.indexOf('крышка') !== -1 && (thick === 26 || name.indexOf('26') !== -1)) {
                    var oldL = p.GSize.x;
                    var oldD = p.GSize.z;
                    normalizePanelContour(p, 828, 620);
                    p.PosY = 2634;
                    fixedCount++;
                    report.push(p.Name + ': ' + oldL.toFixed(1) + 'x' + oldD.toFixed(1) + ' -> 828x620, Y=2634');
                }
                // 5. Задняя стенка толстого шкафа (26 мм): 828 x 2008 на Y = 626
                else if (name.indexOf('задняя') !== -1 && (thick === 26 || name.indexOf('26') !== -1)) {
                    var oldW = p.GSize.x;
                    var oldH = p.GSize.y;
                    normalizePanelContour(p, 828, 2008);
                    p.PosY = 626;
                    fixedCount++;
                    report.push(p.Name + ': ' + oldW.toFixed(1) + 'x' + oldH.toFixed(1) + ' -> 828x2008, Y=626');
                }
                // 6. Полки правого шкафа (16 мм): 1168 x 534
                else if (name.indexOf('полка') !== -1 && thick === 16) {
                    var oldL = p.GSize.x;
                    var oldD = p.GSize.z;
                    normalizePanelContour(p, 1168, 534);
                    p.PosZ = 66; // от задника
                    fixedCount++;
                    report.push(p.Name + ': ' + oldL.toFixed(1) + 'x' + oldD.toFixed(1) + ' -> 1168x534');
                }
                // 7. Крышка и дно правого шкафа (16 мм): 1168 x 534
                else if ((name === 'дно' || name === 'крышка') && thick === 16) {
                    var oldL = p.GSize.x;
                    var oldD = p.GSize.z;
                    normalizePanelContour(p, 1168, 534);
                    p.PosZ = 66;
                    fixedCount++;
                    report.push(p.Name + ' (16 мм): ' + oldL.toFixed(1) + 'x' + oldD.toFixed(1) + ' -> 1168x534');
                }
                // 8. Цоколь (16 мм): 1168 x 60
                else if (name.indexOf('цоколь') !== -1) {
                    normalizePanelContour(p, 1168, 60);
                    fixedCount++;
                    report.push(p.Name + ': длина 1168, высота 60');
                }
            }
        }
    }
    
    scanList(Model);
    
    var msg = 'Нормализация завершена!\nОбработано деталей: ' + fixedCount + '\n\nДетали:\n' + report.join('\n');
    alert(msg);
}

// Запуск
processModel();
"""

def main():
    target_paths = [
        r"z:\Work\генерация мебели\scripts\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\21_Нормализация_шкафов_по_чертежу_2080.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели\21_Нормализация_шкафов_по_чертежу_2080.js",
    ]
    
    # Save in windows-1251
    encoded = script_js.encode('cp1251', errors='replace')
    for p in target_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'wb') as f:
            f.write(encoded)
        print(f"Written: {p}")
        
    # Rebuild Desktop zip
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
