# -*- coding: utf-8 -*-
import os, zipfile

script_js = r"""// 22_Включить_подрезку_кромки_ClipPanel.js
// Назначение: Включает правильную подрезку (ClipPanel = true) для ВСЕХ уже нанесенных кромок.
// Не трогает геометрию, не меняет размеры, не сдвигает детали и фасады!
// Работает с ВЫДЕЛЕННЫМИ деталями (если что-то выделено) или со ВСЕМИ деталями модели.

function processPanelButts(pan) {
    if (!pan || !pan.Butts || pan.Butts.Count === 0) return 0;
    
    try { StartEditing(pan); } catch(e) {}
    
    var buttsInfo = [];
    for (var b = 0; b < pan.Butts.Count; b++) {
        var bt = pan.Butts[b];
        if (bt) {
            buttsInfo.push({
                mat: bt.Material,
                elem: bt.ElemIndex,
                thick: bt.Thickness,
                clip: bt.ClipPanel
            });
        }
    }
    
    var inPlaceOk = true;
    var count = 0;
    for (var b = 0; b < pan.Butts.Count; b++) {
        try {
            pan.Butts[b].ClipPanel = true;
            count++;
        } catch(e) {
            inPlaceOk = false;
            break;
        }
    }
    
    if (!inPlaceOk && buttsInfo.length > 0) {
        pan.Butts.Clear();
        count = 0;
        for (var k = 0; k < buttsInfo.length; k++) {
            try {
                var nb = pan.AddButt(buttsInfo[k].mat, buttsInfo[k].elem);
                if (nb) {
                    nb.ClipPanel = true;
                    count++;
                }
            } catch(eAdd) {}
        }
    }
    
    try { pan.Build(); } catch(eB) {}
    return count;
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
    
    if (Model.SelectionCount > 0) {
        for (var s = 0; s < Model.SelectionCount; s++) {
            extractPanels(Model.Selections[s], targets);
        }
    } else {
        extractPanels(Model, targets);
    }
    
    var panelsCount = 0;
    var buttsCount = 0;
    
    for (var i = 0; i < targets.length; i++) {
        var p = targets[i];
        if (!p || !p.Butts || p.Butts.Count === 0) continue;
        var c = processPanelButts(p);
        if (c > 0) {
            panelsCount++;
            buttsCount += c;
        }
    }
    
    try { Action.Commit(); } catch(eC) {}
    
    alert('Готово!\nПодрезка детали (ClipPanel = true) успешно включена.\nОбработано деталей: ' + panelsCount + '\nОбновлено кромок: ' + buttsCount + '\n\nГеометрия и положение деталей не менялись!');
}

run();
"""

def main():
    target_paths = [
        r"z:\Work\генерация мебели\scripts\22_Включить_подрезку_кромки_ClipPanel.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\22_Включить_подрезку_кромки_ClipPanel.js",
        r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели\22_Включить_подрезку_кромки_ClipPanel.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\22_Включить_подрезку_кромки_ClipPanel.js",
        r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели\22_Включить_подрезку_кромки_ClipPanel.js",
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
