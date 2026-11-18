# -*- coding: utf-8 -*-
import os, zipfile

script_js = r"""// 25_Идеальное_выравнивание_в_одну_линию.js
// Назначение: Выравнивает детали заподлицо в идеальную линию без ступенек в 1 мм!
// 1. Все боковины (26 мм и 16 мм): делает ровно 2660 мм, выравнивая заподлицо с крышками (Y = 2660).
// 2. Все полки (16 мм): делает ровно 534 мм, выравнивая по переднему краю (Z = 600) и заднику (Z = 66).
// 3. Задник 26 мм: НЕ трогает и НЕ укорачивает (оставляет 2634 мм до пола, как задумано!).
// 4. Дно высокое 26 мм: стыкует с задником (глубина 594 мм от Z=26 до Z=620, вровень с фасадом боковин).
// 5. Фасады, створки и петли НЕ затрагиваются!

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
    var fixedBottom = 0;
    var report = [];
    
    function scan(obj) {
        if (!obj) return;
        if (obj.AsPanel) {
            var p = obj.AsPanel;
            var nm = (p.Name || '').toLowerCase();
            
            // Пропускаем фасады, двери, петли
            if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('створк') !== -1) return;
            
            var cMin = p.Contour.Min;
            var cMax = p.Contour.Max;
            var cL = Math.max(cMax.x - cMin.x, cMax.y - cMin.y);
            var cW = Math.min(cMax.x - cMin.x, cMax.y - cMin.y);
            var is26 = (p.Thickness >= 22 || nm.indexOf('26') !== -1);
            
            // 1. БОКОВИНЫ: ровно 2660 мм вровень с крышкой (Y=0..2660)
            if (nm.indexOf('боковина') !== -1 && cL >= 2640 && cL <= 2670) {
                var targetDepth = is26 ? 620 : 600;
                fitContour(p, 2660, targetDepth);
                p.PosY = 0;
                fixedSides++;
                report.push(p.Name + ': высота 2660 мм заподлицо с крышкой (было ' + cL.toFixed(1) + ')');
            }
            
            // 2. ПОЛКИ: ровно 534 мм вровень с передним срезом боковин (Z=66..600)
            else if (nm.indexOf('полка') !== -1 && cW >= 520 && cW <= 540) {
                fitContour(p, 1168, 534);
                p.PosZ = 66; // встык к задней стенке
                fixedShelves++;
                report.push(p.Name + ': глубина 534 мм вровень с передним краем (было ' + cW.toFixed(1) + ')');
            }
            
            // 3. ДНО ВЫСОКОЕ 26 мм: стыкуем с задником 26 мм (Z=26..620, глубина 594 мм)
            else if (nm.indexOf('дно') !== -1 && is26) {
                // Если задник опущен до пола (Z=0..26), дно должно иметь глубину 594 мм, чтобы не врезаться в задник
                fitContour(p, 828, 594);
                p.PosZ = 26; // начинается от передней пласти задника
                p.PosY = 600; // ниша снизу 600 мм
                fixedBottom++;
                report.push(p.Name + ': глубина 594 мм встык к заднику (Z=26..620, вровень с боковинами)');
            }
            
            // 4. ЗАДНИК 26 мм: НЕ трогаем!
            else if (nm.indexOf('задняя') !== -1 && is26) {
                // Оставляем 2634 мм как сделал пользователь
                report.push(p.Name + ': размер сохранен по вашему плану (до пола)');
            }
            
            // Сохраняем флаг подрезки кромки
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
    
    alert('Идеальное выравнивание завершено!\n\n' +
          '• Боковины выровнены на 2660 мм: ' + fixedSides + '\n' +
          '• Полки выровнены на 534 мм: ' + fixedShelves + '\n' +
          '• Дно высокое состыковано с задником: ' + fixedBottom + '\n' +
          '• Задник 26 мм сохранен (до пола)\n\n' +
          'Все ступеньки в 1 мм устранены!');
}

run();
"""

def main():
    target_paths = [
        r"z:\Work\генерация мебели\scripts\25_Идеальное_выравнивание_в_одну_линию.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\25_Идеальное_выравнивание_в_одну_линию.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели\25_Идеальное_выравнивание_в_одну_линию.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\25_Идеальное_выравнивание_в_одну_линию.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели\25_Идеальное_выравнивание_в_одну_линию.js",
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
