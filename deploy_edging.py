# -*- coding: utf-8 -*-
import os
import shutil
import zipfile

xml_content = """<?xml version="1.0" encoding="UTF-8"?>
<Options>
  <Items>
    <Item Name="1. Кромочные материалы">
      <ReadOnly>Y</ReadOnly>
      <Items>
        <Item Name="Кромка 0.8 мм (лицевая сторона)">
          <Value>
            <Name>0.8мм 16х</Name>
            <Thickness>0.8</Thickness>
            <Width>-1</Width>
            <Tape>Y</Tape>
            <Sign>0.8</Sign>
            <Overhung>0</Overhung>
            <Clip>1</Clip>
          </Value>
        </Item>
        <Item Name="Кромка 0.4 мм (открытый корпус)">
          <Value>
            <Name>0.4</Name>
            <Thickness>0.4</Thickness>
            <Width>-1</Width>
            <Tape>Y</Tape>
            <Sign>0.4</Sign>
            <Overhung>0</Overhung>
            <Clip>1</Clip>
          </Value>
        </Item>
        <Item Name="Подрезать деталь (ClipPanel)">
          <Value>1</Value>
        </Item>
      </Items>
    </Item>
    <Item Name="2. Направление лица шкафа">
      <ReadOnly>Y</ReadOnly>
      <Items>
        <Item Name="Лицевая сторона">
          <Value>Вперед (+Z, стандарт)</Value>
        </Item>
      </Items>
    </Item>
  </Items>
</Options>
"""

js_content = """// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 перед + 0.4 корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
//
// Логика кромления:
//   1. Пользователь выделяет доски (или весь шкаф, если ничего не выбрано).
//   2. Лицевые передние торцы -> Кромка 0.8 мм (зеленая, 0.8мм 16х).
//   3. Открытые наружные торцы (IsButtVisible) -> Кромка 0.4 мм (синяя/голубая, 0.4).
//   4. Стыки полок и стенок -> Без кромки (чистые, красные при проверке).
//   5. Фасады и задняя стенка ДВП (<8мм) -> Не кромятся (пропускаются).
// =========================================================================

var FileOptions = 'Настройки_кромки.xml';

// --- 1. ПАНЕЛЬ СВОЙСТВ СЛЕВА (Action.Properties) ---
var Prop = Action.Properties;

// Группа 1: Кромочные материалы
var grMat = Prop.NewGroup('1. Кромочные материалы');
var pEdgeFront = grMat.NewButt('Кромка 0.8 мм (лицевая сторона)');
var pEdgeBody  = grMat.NewButt('Кромка 0.4 мм (открытый корпус)');
var pClip      = grMat.NewBool('Подрезать деталь (ClipPanel)', true);

// Группа 2: Направление лица шкафа
var grDir = Prop.NewGroup('2. Направление лица шкафа');
var pDirCombo = grDir.NewCombo('Лицевая сторона', 'Вперед (+Z, стандарт)\\nНазад (-Z)\\nВправо (+X)\\nВлево (-X)');
pDirCombo.ItemIndex = 0;
try { pDirCombo.Value = 'Вперед (+Z, стандарт)'; } catch(e) {}

var btnPickDir = grDir.NewButton('Указать перед кликом по ребру');

// Группа 3: Действия
var grAct = Prop.NewGroup('3. Действия');
var btnApplyAll  = grAct.NewButton('Облицевать (0.8 перед + 0.4 корпус)');
var btnFrontOnly = grAct.NewButton('Только ПЕРЕДНИЕ торцы (0.8 мм)');
var btnBodyOnly  = grAct.NewButton('Только ОТКРЫТЫЕ торцы (0.4 мм)');
var btnClear     = grAct.NewButton('Очистить кромки на выбранных');
var btnFinish    = grAct.NewButton('Завершить работу');

// Кнопка внизу панели команд
var btnBarFinish = NewButtonInput('Завершить');
btnBarFinish.OnChange = function() {
    Action.Finish();
};

// Загрузка сохраненных настроек материалов
var configFiles = [
    'Настройки_кромки.xml',
    'Scripts\\\\Настройки_кромки.xml',
    'Scripts\\\\Генерация мебели\\\\Настройки_кромки.xml',
    'C:\\\\Users\\\\maxim\\\\OneDrive\\\\Документы\\\\Bazis\\\\Scripts\\\\Настройки_кромки.xml',
    'C:\\\\Users\\\\maxim\\\\OneDrive\\\\Документы\\\\Bazis\\\\Scripts\\\\Генерация мебели\\\\Настройки_кромки.xml',
    'C:\\\\Users\\\\maxim\\\\Desktop\\\\БАЗИС_ЛАЙТ\\\\Bazis_Documents\\\\Scripts\\\\Настройки_кромки.xml',
    'C:\\\\Users\\\\maxim\\\\Desktop\\\\БАЗИС_ЛАЙТ\\\\Bazis_Documents\\\\Scripts\\\\Генерация мебели\\\\Настройки_кромки.xml'
];

for (var cf = 0; cf < configFiles.length; cf++) {
    try {
        Action.Properties.Load(configFiles[cf]);
        break;
    } catch(eLoad) {}
}

// Принудительно гарантируем, что направление по умолчанию - Вперед (+Z)
if (!pDirCombo.Value || pDirCombo.Value.indexOf('-X') !== -1) {
    pDirCombo.ItemIndex = 0;
    try { pDirCombo.Value = 'Вперед (+Z, стандарт)'; } catch(eD) {}
}

// Сохранение при выходе
Action.OnFinish = function() {
    try {
        Action.Properties.Save(FileOptions);
    } catch(eSave) {}
};

// --- 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

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

function getPanelsToProcess() {
    var raw = [];
    if (Model.SelectionCount > 0) {
        for (var s = 0; s < Model.SelectionCount; s++) {
            extractPanels(Model.Selections[s], raw);
        }
    }
    if (raw.length === 0) {
        extractPanels(Model, raw);
    }

    var targets = [];
    var seen = [];
    for (var i = 0; i < raw.length; i++) {
        var p = raw[i];
        if (!p) continue;
        var already = false;
        for (var k = 0; k < seen.length; k++) {
            if (seen[k] === p) { already = true; break; }
        }
        if (already) continue;
        seen.push(p);

        if (isFacadePanel(p) || isBackWall(p)) continue;
        targets.push(p);
    }
    return targets;
}

// Надежное чтение направления лица шкафа (по текстовому значению комбо!)
function getFrontVector() {
    var val = (pDirCombo && pDirCombo.Value) ? String(pDirCombo.Value) : '';
    if (val.indexOf('-Z') !== -1 || val.indexOf('Назад') !== -1) {
        return { x: 0, y: 0, z: -1 };
    }
    if (val.indexOf('+X') !== -1 || val.indexOf('Вправо') !== -1) {
        return { x: 1, y: 0, z: 0 };
    }
    if (val.indexOf('-X') !== -1 || val.indexOf('Влево') !== -1) {
        return { x: -1, y: 0, z: 0 };
    }
    return { x: 0, y: 0, z: 1 }; // По умолчанию: Вперед (+Z, стандарт)
}

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

// --- 3. НАЗНАЧЕНИЕ НАПРАВЛЕНИЯ ПЕРЕДА ПО КЛИКНУТОМУ РЕБРУ ---
function setFrontDirectionFromEdge(edge, targets) {
    if (!edge) return;
    var pt = edge.First || edge.GFirst;
    if (!pt) return;

    var tMinZ = 1e9, tMaxZ = -1e9;
    var tMinX = 1e9, tMaxX = -1e9;

    var panelList = (targets && targets.length > 0) ? targets : getPanelsToProcess();
    for (var i = 0; i < panelList.length; i++) {
        var p = panelList[i];
        if (!p) continue;
        if (p.GabMin.z < tMinZ) tMinZ = p.GabMin.z;
        if (p.GabMax.z > tMaxZ) tMaxZ = p.GabMax.z;
        if (p.GabMin.x < tMinX) tMinX = p.GabMin.x;
        if (p.GabMax.x > tMaxX) tMaxX = p.GabMax.x;
    }

    var tMidZ = (tMinZ + tMaxZ) / 2;
    var tMidX = (tMinX + tMaxX) / 2;

    var dz = pt.z - tMidZ;
    var dx = pt.x - tMidX;

    // В мебели глубина почти всегда по Z (вперед/назад).
    // Если смещение по Z доминирует или клик ближе к передней/задней плоскости:
    if (Math.abs(dz) >= Math.abs(dx)) {
        if (dz >= 0) {
            pDirCombo.ItemIndex = 0;
            try { pDirCombo.Value = 'Вперед (+Z, стандарт)'; } catch(e) {}
        } else {
            pDirCombo.ItemIndex = 1;
            try { pDirCombo.Value = 'Назад (-Z)'; } catch(e) {}
        }
    } else {
        if (dx >= 0) {
            pDirCombo.ItemIndex = 2;
            try { pDirCombo.Value = 'Вправо (+X)'; } catch(e) {}
        } else {
            pDirCombo.ItemIndex = 3;
            try { pDirCombo.Value = 'Влево (-X)'; } catch(e) {}
        }
    }
}

// --- 4. ИНТЕРАКТИВНОЕ УКАЗАНИЕ РЕБРА ---
function pickFrontEdge() {
    Action.Hint = 'Кликните ПЕРЕДНЕЕ вертикальное ребро шкафа (стойки, боковины или петли)';
    try {
        var e = GetEdge('Кликните переднее вертикальное ребро шкафа', AxisY);
        if (e && (e.First || e.GFirst)) {
            var targets = getPanelsToProcess();
            setFrontDirectionFromEdge(e, targets);
            Action.Hint = 'Лицевая сторона установлена: ' + pDirCombo.Value + '. Выполняю кромление...';
            // СРАЗУ же наносим кромку!
            runEdging(false, 'all');
            return true;
        }
    } catch(errEdge) {
        alert('Ошибка при выборе ребра: ' + errEdge.message);
    }
    return false;
}

// --- 5. ОСНОВНАЯ ФУНКЦИЯ ОБЛИЦОВКИ ---
function runEdging(askEdge, mode) {
    var targets = getPanelsToProcess();
    if (targets.length === 0) {
        alert('Не найдено ни одной детали корпуса для кромления!');
        return;
    }

    if (askEdge) {
        Action.Hint = 'Шаг 1/2: Кликните ПЕРЕДНЕЕ вертикальное ребро шкафа (Esc / Enter - вперед по Z)';
        try {
            var e = GetEdge('Кликните переднее ребро шкафа (Esc - авто вперед по Z)', AxisY);
            if (e && (e.First || e.GFirst)) {
                setFrontDirectionFromEdge(e, targets);
            }
        } catch(eIgnore) {}
    }

    var fDir = getFrontVector();
    var clip = pClip.Value;
    var countPanels = 0;
    var countFront = 0;
    var countOpen = 0;

    for (var i = 0; i < targets.length; i++) {
        var pan = targets[i];
        if (!pan || !pan.Contour || pan.Contour.Count === 0) continue;

        StartEditing(pan);
        pan.Butts.Clear();

        var fIndex = getFrontContourIndex(pan, fDir);

        for (var ce = 0; ce < pan.Contour.Count; ce++) {
            if (ce === fIndex) {
                if (mode === 'all' || mode === 'front') {
                    // ЛИЦЕВОЙ ПЕРЕДНИЙ ТОРЕЦ -> КРОМКА 0.8 ММ
                    var b08 = pan.AddButt(pEdgeFront, ce);
                    if (b08) {
                        b08.ClipPanel = clip;
                        countFront++;
                    }
                }
            } else if (pan.IsButtVisible(ce, 5)) {
                if (mode === 'all' || mode === 'open') {
                    // ОТКРЫТЫЙ ТОРЕЦ КОРПУСА -> КРОМКА 0.4 ММ
                    var b04 = pan.AddButt(pEdgeBody, ce);
                    if (b04) {
                        b04.ClipPanel = clip;
                        countOpen++;
                    }
                }
            }
            // ЗАКРЫТЫЕ СТЫКИ ДЕТАЛЕЙ ОСТАЮТСЯ БЕЗ КРОМКИ (ЧИСТЫЕ)
        }

        pan.Build();
        countPanels++;
    }

    Action.Commit();

    var hintText = 'Готово! Облицовано деталей: ' + countPanels + ' | Лицевых (0.8 мм): ' + countFront + ' | Корпус (0.4 мм): ' + countOpen + ' [' + pDirCombo.Value + ']';
    Action.Hint = hintText;
}

function clearButts() {
    var targets = getPanelsToProcess();
    var count = 0;
    for (var i = 0; i < targets.length; i++) {
        var pan = targets[i];
        if (pan.Butts && pan.Butts.Count > 0) {
            StartEditing(pan);
            pan.Butts.Clear();
            pan.Build();
            count++;
        }
    }
    Action.Commit();
    Action.Hint = 'Кромки очищены на ' + count + ' деталях.';
}

// --- 6. НАЗНАЧЕНИЕ КНОПОК ---
btnPickDir.OnClick = function() {
    Action.AsyncExec(function() {
        pickFrontEdge();
    });
};

btnApplyAll.OnClick = function() {
    Action.AsyncExec(function() {
        runEdging(false, 'all');
    });
};

btnFrontOnly.OnClick = function() {
    Action.AsyncExec(function() {
        runEdging(false, 'front');
    });
};

btnBodyOnly.OnClick = function() {
    Action.AsyncExec(function() {
        runEdging(false, 'open');
    });
};

btnClear.OnClick = function() {
    Action.AsyncExec(function() {
        clearButts();
    });
};

btnFinish.OnClick = function() {
    Action.Finish();
};

// При смене направления в выпадающем списке — сразу пересчитываем кромку!
pDirCombo.OnChange = function() {
    Action.AsyncExec(function() {
        runEdging(false, 'all');
    });
};

// --- 7. ЗАПУСК ПРИ СТАРТЕ СКРИПТА ---
// При запуске сразу спрашиваем переднее ребро (или Esc для стандартного Z+),
// наносим кромки и оставляем окно свойств открытым!
Action.AsyncExec(function() {
    runEdging(true, 'all');
});

Action.Continue();
"""

# Destination folders
dest_dirs = [
    r"z:\Work\генерация мебели\scripts",
    r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts",
    r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели",
    r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts",
    r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели"
]

script_filename = "Умная облицовка шкафа (0.8 перед + 0.4 корпус).js"
xml_filename = "Настройки_кромки.xml"

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)
    js_path = os.path.join(d, script_filename)
    xml_path = os.path.join(d, xml_filename)

    with open(js_path, "w", encoding="cp1251") as f:
        f.write(js_content)
    with open(xml_path, "w", encoding="utf-8") as f:
        f.write(xml_content)
    print(f"Written to: {js_path} and {xml_path}")

# Update zip archive cleanly from desktop folder
desktop_folder = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ"
zip_path = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ.zip"
temp_zip = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ_tmp.zip"

if os.path.exists(desktop_folder):
    file_count = 0
    with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(desktop_folder):
            for f in files:
                full_path = os.path.join(root, f)
                arcname = os.path.relpath(full_path, desktop_folder)
                zf.write(full_path, arcname)
                file_count += 1
    os.replace(temp_zip, zip_path)
    print(f"Cleanly updated БАЗИС_ЛАЙТ.zip ({file_count} files)")

print("Deployment complete!")
