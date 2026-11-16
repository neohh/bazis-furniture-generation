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

function getFrontVector() {
    var idx = (pDirCombo && typeof pDirCombo.ItemIndex !== 'undefined') ? pDirCombo.ItemIndex : 0;
    if (idx === 1) return { x: 0, y: 0, z: -1 }; // Назад (-Z)
    if (idx === 2) return { x: 1, y: 0, z: 0 };  // Вправо (+X)
    if (idx === 3) return { x: -1, y: 0, z: 0 }; // Влево (-X)
    return { x: 0, y: 0, z: 1 };                  // Вперед (+Z, стандарт)
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

// --- 3. ТОЧНОЕ ОПРЕДЕЛЕНИЕ НАПРАВЛЕНИЯ ПЕРЕДА ПО КЛИКНУТОМУ РЕБРУ ---
function determineFrontDirectionFromEdge(edge, targets) {
    if (!edge) return 0; // По умолчанию 0: +Z (Вперед)

    var p1 = edge.GFirst || edge.First;
    var p2 = edge.GLast || edge.Last;
    if (!p1 || !p2) return 0;

    var edgeMid = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: (p1.z + p2.z) / 2
    };

    var lenX = Math.abs(p2.x - p1.x);
    var lenY = Math.abs(p2.y - p1.y);
    var lenZ = Math.abs(p2.z - p1.z);

    // Вычисляем габариты обрабатываемых деталей шкафа (а НЕ всей комнаты/модели!)
    var tMinX = 1e9, tMaxX = -1e9;
    var tMinY = 1e9, tMaxY = -1e9;
    var tMinZ = 1e9, tMaxZ = -1e9;

    var panelList = (targets && targets.length > 0) ? targets : [];
    if (panelList.length === 0) {
        panelList = getPanelsToProcess();
    }

    // Ищем панель, которой принадлежит кликнутое ребро
    var ownerPanel = null;
    var bestDist = 1e9;

    for (var i = 0; i < panelList.length; i++) {
        var pan = panelList[i];
        if (!pan) continue;
        if (pan.GabMin.x < tMinX) tMinX = pan.GabMin.x;
        if (pan.GabMax.x > tMaxX) tMaxX = pan.GabMax.x;
        if (pan.GabMin.y < tMinY) tMinY = pan.GabMin.y;
        if (pan.GabMax.y > tMaxY) tMaxY = pan.GabMax.y;
        if (pan.GabMin.z < tMinZ) tMinZ = pan.GabMin.z;
        if (pan.GabMax.z > tMaxZ) tMaxZ = pan.GabMax.z;

        if (pan.Contour) {
            for (var c = 0; c < pan.Contour.Count; c++) {
                var el = pan.Contour[c];
                if (el && el.Pos1 && el.Pos2) {
                    var g1 = pan.ToGlobal(NewVector(el.Pos1.x, el.Pos1.y, 0));
                    var g2 = pan.ToGlobal(NewVector(el.Pos2.x, el.Pos2.y, 0));
                    var cMidX = (g1.x + g2.x) / 2;
                    var cMidY = (g1.y + g2.y) / 2;
                    var cMidZ = (g1.z + g2.z) / 2;
                    var d = Math.sqrt(
                        Math.pow(cMidX - edgeMid.x, 2) +
                        Math.pow(cMidY - edgeMid.y, 2) +
                        Math.pow(cMidZ - edgeMid.z, 2)
                    );
                    if (d < bestDist) {
                        bestDist = d;
                        ownerPanel = pan;
                    }
                }
            }
        }
    }

    // Базовый центр для анализа: центр конкретной панели или центр обрабатываемого шкафа
    var refZ = (tMinZ + tMaxZ) / 2;
    var refX = (tMinX + tMaxX) / 2;

    if (ownerPanel) {
        refZ = (ownerPanel.GabMin.z + ownerPanel.GabMax.z) / 2;
        refX = (ownerPanel.GabMin.x + ownerPanel.GabMax.x) / 2;
    }

    // ГЕОМЕТРИЧЕСКИЙ АНАЛИЗ ОРИЕНТАЦИИ РЕБРА:
    // Лицевое ребро шкафа лежит в плоскости фасада/переда!
    // 1. Если шкаф стоит прямо (лицо по Z):
    //    Переднее ребро полки идет вдоль оси X (lenZ ~ 0).
    //    Переднее ребро стойки идет вдоль оси Y (lenZ ~ 0).
    //    В обоих случаях lenZ < 3 мм! Это железный признак плоскости Z.
    // 2. Если шкаф повернут на 90 градусов (лицо по X):
    //    Переднее ребро идет вдоль Z или Y, а lenX < 3 мм.
    var isConstZ = (lenZ < 3.0 && (lenX > 5.0 || lenY > 5.0));
    var isConstX = (lenX < 3.0 && (lenZ > 5.0 || lenY > 5.0));

    if (isConstZ) {
        // Ребро в плоскости XY -> нормаль строго по Z!
        if (edgeMid.z >= refZ) {
            return 0; // Вперед (+Z, стандарт)
        } else {
            return 1; // Назад (-Z)
        }
    }

    if (isConstX) {
        // Ребро в плоскости YZ -> нормаль строго по X!
        if (edgeMid.x >= refX) {
            return 2; // Вправо (+X)
        } else {
            return 3; // Влево (-X)
        }
    }

    // Fallback: сравниваем смещение от центра конкретного шкафа
    var dz = edgeMid.z - refZ;
    var dx = edgeMid.x - refX;

    if (Math.abs(dz) >= Math.abs(dx)) {
        return (dz >= 0) ? 0 : 1;
    } else {
        return (dx >= 0) ? 2 : 3;
    }
}

// --- 4. ИНТЕРАКТИВНОЕ УКАЗАНИЕ РЕБРА ---
function pickFrontEdge() {
    Action.Hint = 'Кликните ПЕРЕДНЕЕ ребро шкафа (любое: полки, стойки, дна или крышки)';
    try {
        var e = GetEdge('Кликните переднее ребро шкафа');
        if (e) {
            var targets = getPanelsToProcess();
            var dirIdx = determineFrontDirectionFromEdge(e, targets);
            pDirCombo.ItemIndex = dirIdx;
            Action.Hint = 'Лицевая сторона установлена: ' + pDirCombo.Value + '. Выполняю кромление...';
            // СРАЗУ же автоматически применяем кромление по указанному ребру!
            runEdging(false, 'all');
            return true;
        }
    } catch(errEdge) {}
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
        Action.Hint = 'Шаг 1/2: Кликните ПЕРЕДНЕЕ ребро шкафа (Esc / Enter - авто вперед по Z)';
        try {
            var e = GetEdge('Кликните ПЕРЕДНЕЕ ребро шкафа (Esc - вперед по Z)');
            if (e) {
                var dirIdx = determineFrontDirectionFromEdge(e, targets);
                pDirCombo.ItemIndex = dirIdx;
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

// При смене направления в выпадающем списке — сразу пересчитываем кромку
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
