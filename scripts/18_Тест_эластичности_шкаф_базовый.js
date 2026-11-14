// ==============================================================================
// 18_Тест_эластичности_шкаф_базовый.js
// Тестирование эластичности нового фрагмента "шкаф базовый.fr3d"
// Проверяет исходные габариты, наличие эластичности и корректность
// растяжения до целевых размеров (1200 x 2660 x 600 мм).
// ==============================================================================

// 1. Поиск файла фрагмента "шкаф базовый.fr3d"
function findFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        try {
            if (system.fileExists(paths[i])) return paths[i];
        } catch(e) {}
    }
    return '';
}

var fragPath = findFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф базовый.fr3d',
    'z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф базовый.fr3d',
    'C:\\Users\\maxim\\Downloads\\шкаф базовый.fr3d'
]);

if (fragPath === '') {
    alert('Файл "шкаф базовый.fr3d" не найден!\nПроверьте наличие файла в папке Фрагменты\\Шкафы или Загрузки.');
    Action.Finish();
}

// Поиск эластичного блока
function findResizeBlock(obj) {
    if (!obj) return null;
    if (obj.ElasticResize) return obj;
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            var child = obj.Objects ? obj.Objects[i] : obj[i];
            var found = findResizeBlock(child);
            if (found) return found;
        }
    }
    return null;
}

// Рекурсивный сбор информации о деталях
function inspectBlock(obj, indent) {
    indent = indent || '';
    var info = [];
    if (!obj) return info;

    var name = obj.Name || (obj.AsPanel ? 'Панель' : 'Объект');
    var sizeStr = '';
    if (obj.GSize) {
        sizeStr = ' [' + Math.round(obj.GSize.x) + ' x ' + Math.round(obj.GSize.y) + ' x ' + Math.round(obj.GSize.z) + ']';
    }
    var elMark = obj.ElasticResize ? ' (ЭЛАСТИЧНЫЙ)' : '';
    info.push(indent + name + sizeStr + elMark);

    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            var child = obj.Objects ? obj.Objects[i] : obj[i];
            info = info.concat(inspectBlock(child, indent + '  '));
        }
    }
    return info;
}

// 2. Панель свойств
var Prop = null;
try {
    Prop = Action.Properties;
    Prop.Clear();
} catch(ePr) {}

var pMode = null;
var pTargetW = null;
var pTargetH = null;
var pTargetD = null;

if (Prop) {
    var gr = Prop.NewGroup('Параметры теста эластичности');
    pMode = gr.NewCombo('Режим теста',
        '1. Сравнение: Исходный (1:1) и Растянутый (1200x2660x600) рядом\n' +
        '2. Только Растянутый до целевых размеров\n' +
        '3. Серия из 3 тестов: Узкий (600), Средний (1200), Широкий (1600)'
    );
    pMode.ItemIndex = 0;

    pTargetW = gr.NewNumber('Целевая ширина X (мм)', 1200);
    pTargetH = gr.NewNumber('Целевая высота Y (мм)', 2660);
    pTargetD = gr.NewNumber('Целевая глубина Z (мм)', 600);
}

// 3. Выполнение теста
function runTest() {
    // Удаляем предыдущую геометрию текущей модели при перестроении
    DeleteNewObjects();

    var mode = pMode ? pMode.ItemIndex : 0;
    var tW = pTargetW ? pTargetW.Value : 1200;
    var tH = pTargetH ? pTargetH.Value : 2660;
    var tD = pTargetD ? pTargetD.Value : 600;

    var testGroup = BeginBlock('Тест эластичности: шкаф базовый');

    var posX = 0;

    // --- ОБРАЗЕЦ 1: Исходный блок (как сохранен) ---
    if (mode === 0) {
        var origBlock = AddBlock('1. Исходный шкаф базовый (оригинал)');
        var okOrig = origBlock.Load(fragPath);
        if (okOrig) {
            origBlock.Position = NewVector(posX, 0, 0);
            origBlock.Build();
            var origW = origBlock.GSize ? Math.round(origBlock.GSize.x) : 0;
            var origH = origBlock.GSize ? Math.round(origBlock.GSize.y) : 0;
            var origD = origBlock.GSize ? Math.round(origBlock.GSize.z) : 0;
            origBlock.Name = '1. Исходный [' + origW + 'x' + origH + 'x' + origD + ']';
            posX += origW + 200;
        }
    }

    // --- ОБРАЗЕЦ 2: Целевой растянутый (или серия) ---
    var targets = [];
    if (mode === 0 || mode === 1) {
        targets.push({ w: tW, h: tH, d: tD, title: 'Целевой' });
    } else if (mode === 2) {
        targets.push({ w: 600, h: 2100, d: 450, title: 'Узкий 600' });
        targets.push({ w: 1200, h: 2660, d: 600, title: 'Целевой 1200' });
        targets.push({ w: 1600, h: 2660, d: 600, title: 'Широкий 1600' });
    }

    var reportLines = [];
    reportLines.push('Файл: ' + fragPath);

    for (var k = 0; k < targets.length; k++) {
        var tgt = targets[k];
        var testBlock = AddBlock((k + 2) + '. ' + tgt.title + ' [' + tgt.w + 'x' + tgt.h + 'x' + tgt.d + ']');
        var ok = testBlock.Load(fragPath);
        if (!ok) {
            reportLines.push('Ошибка загрузки блока ' + tgt.title);
            continue;
        }

        var rObj = findResizeBlock(testBlock);
        var hasElastic = (rObj !== null);

        if (rObj) {
            try {
                rObj.ElasticResize(NewVector(tgt.w, tgt.h, tgt.d));
                rObj.Build();
            } catch(eR) {
                reportLines.push('Ошибка ElasticResize: ' + eR.message);
            }
        }

        testBlock.Position = NewVector(posX, 0, 0);
        testBlock.Build();

        var realW = testBlock.GSize ? Math.round(testBlock.GSize.x) : 0;
        var realH = testBlock.GSize ? Math.round(testBlock.GSize.y) : 0;
        var realD = testBlock.GSize ? Math.round(testBlock.GSize.z) : 0;

        var status = (realW === tgt.w && realH === tgt.h && realD === tgt.d) ? 'УСПЕХ (100% точный)' : 'НЕСООТВЕТСТВИЕ: факт [' + realW + 'x' + realH + 'x' + realD + ']';
        reportLines.push(tgt.title + ' -> задано: ' + tgt.w + 'x' + tgt.h + 'x' + tgt.d + ' | факт: ' + realW + 'x' + realH + 'x' + realD + ' [' + (hasElastic ? 'Эластичность ЕСТЬ' : 'НЕТ ЭЛАСТИЧНОСТИ!') + '] -> ' + status);

        posX += Math.max(realW, tgt.w) + 200;
    }

    EndBlock();

    try {
        Action.Commit();
    } catch(eC) {}

    try {
        ViewAll();
        SetCamera(p3dIsometric);
    } catch(eV) {}

    Action.Hint = reportLines.join(' || ');
}

// Запуск теста
runTest();

// Перестроение при изменении параметров
if (Prop) {
    Prop.OnChange = function() {
        runTest();
    };
}
