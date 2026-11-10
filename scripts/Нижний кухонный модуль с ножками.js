// =============================================================================
// Базис-Мебельщик: Генератор нижнего кухонного модуля (базы) под столешницу
// Версия 3.0: 
// - Две планки (царги 80 мм) под столешницу по умолчанию
// - Ножки с 4-мя симметричными вычитающими цилиндрами d=5x12 мм
// - Фасады (распашные двери) с зазорами по 1.5 мм по стандарту и петлями
// =============================================================================

var FileOptions = 'Kitchen_Base_Config.xml';

// 1. Поиск модели кухонной ножки в доступных библиотеках
function getLegPathByChoice(choiceIndex, height) {
    var baseDir = 'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Ножки для кухни под цоколь\\';
    var desktopDir = 'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Ножки_для_кухни_под_цоколь\\';
    
    var subPath = '';
    if (choiceIndex === 0) {
        // Полная ножка H.100 (4 симметричных цилиндра d=5x12 мм, без ушек, со стойкой и пяткой)
        subPath = 'Неопласт\\Ножка под цоколь H.100 с присадкой d.5x12.f3d';
    } else if (choiceIndex === 1) {
        // UNION PLAST с бобышкой d=10 мм (под присадку ЧПУ)
        subPath = 'UNION PLAST\\База на бобышке d.10 для ножек разборных серии 220, черная.f3d';
    } else if (choiceIndex === 2) {
        // Неопласт с бобышкой d=15 мм (под присадку ЧПУ)
        subPath = 'Неопласт\\База на бобышке d.15 для ножек разборных серии РНЦ, цвет черный.f3d';
    } else if (choiceIndex === 3) {
        // Неопласт H.100 исходная (крепление шуруп)
        subPath = 'Неопласт\\Ножка под цоколь H.100 (95-130) неразборная (крепление шуруп) цвет черный.f3d';
    } else {
        // VOLPATO (чистая 3D-модель)
        subPath = 'VOLPATO\\Ножка под цоколь H.' + height + ' разборная, черная.f3d';
    }

    if (system.fileExists(baseDir + subPath)) {
        return baseDir + subPath;
    }
    if (system.fileExists(desktopDir + subPath)) {
        return desktopDir + subPath;
    }
    return baseDir + subPath;
}

// 2. Инициализация параметров
var prop = Action.Properties;
prop.Clear();

// Группа 1: Габариты модуля
var grSize = prop.NewGroup('Габариты модуля кухни');
var propWidth = grSize.NewNumber('Ширина модуля (мм)', 600);
var propDepth = grSize.NewNumber('Глубина корпуса (мм)', 510);
var propBodyHeight = grSize.NewNumber('Высота корпуса (мм)', 720);
var propLegHeight = grSize.NewCombo('Высота ножек (мм)', '100\n150\n80\n60');
propLegHeight.ItemIndex = 0; // 100 мм

// Группа 2: Конструкция верха и каркаса
var grConst = prop.NewGroup('Конструкция каркаса');
var propTopType = grConst.NewCombo('Верх модуля', 
    'Две планки под столешницу (царги 80 мм)\n' +
    'Сплошная крышка (горизонт)'
);
propTopType.ItemIndex = 0; // По умолчанию: две планки (царги) 80 мм!
var propPlankWidth = grConst.NewNumber('Ширина царг (мм)', 80);

var propBottomType = grConst.NewCombo('Тип дна', 'Проходное дно (боковины на дне)\nВкладное дно (между боковин)');
propBottomType.ItemIndex = 0;

var propHasShelf = grConst.NewBool('Съемная полка', true);
var propHasBack = grConst.NewBool('Задняя стенка (ХДФ 4 мм)', true);

// Группа 3: Фасады и двери
var grDoors = prop.NewGroup('Фасады и двери');
var propDoorType = grDoors.NewCombo('Двери (фасады)', 
    '2 двери (распашные)\n' +
    '1 дверь (петли слева)\n' +
    '1 дверь (петли справа)\n' +
    'Без дверей (открытый каркас)'
);
propDoorType.ItemIndex = 0; // По умолчанию: 2 двери, как на фото!
var propDoorGap = grDoors.NewNumber('Зазор по периметру (мм)', 1.5);
var propHinges = grDoors.NewBool('Устанавливать петли "петля МОЯ"', true);
var propHandles = grDoors.NewBool('Устанавливать ручки', true);

// Группа 4: Опоры и присадка (отверстия)
var grLegs = prop.NewGroup('Опоры и ножки');
var propLegModel = grLegs.NewCombo('Модель опоры', 
    'Неопласт H.100 (4 цилиндра d=5x12 мм)\n' +
    'UNION PLAST (бобышка ЧПУ d=10x12 мм)\n' +
    'Неопласт (бобышка ЧПУ d=15x12 мм)\n' +
    'VOLPATO H.100 (чистая 3D-модель)'
);
propLegModel.ItemIndex = 0; // По умолчанию: полная ножка с 4 цилиндрами

var propThroughHole = grLegs.NewBool('Отверстие d=10 мм в дне для регулировки изнутри', false);
var propLegFrontOffset = grLegs.NewNumber('Отступ передних ножек (мм)', 60);
var propLegBackOffset = grLegs.NewNumber('Отступ задних ножек (мм)', 50);
var propLegSideOffset = grLegs.NewNumber('Отступ ножек с боков (мм)', 50);

// Группа 5: Материалы и кромка
var grMat = prop.NewGroup('Материалы');
var propMatBody = grMat.NewMaterial('Материал корпуса');
var propEdgeFront = grMat.NewButt('Кромка фасадная (0.8 мм)');
var propEdgeBody = grMat.NewButt('Кромка корпусная (0.4 мм)');

// Кнопки действий
var grActions = prop.NewGroup('Действия');
var btnBuild = grActions.NewButton('Сгенерировать модуль');
var btnFinish = grActions.NewButton('Готово (сохранить)');

// 3. Основная функция построения
function buildKitchenBase() {
    DeleteNewObjects();

    propMatBody.SetActive();
    var thick = ActiveMaterial.Thickness;
    if (!thick || thick <= 0) thick = 16;

    var width = propWidth.Value;
    var depth = propDepth.Value;
    var bodyHeight = propBodyHeight.Value;
    var legH = parseInt(propLegHeight.Value, 10) || 100;
    
    var frontOffset = propLegFrontOffset.Value;
    var backOffset = propLegBackOffset.Value;
    var sideOffset = propLegSideOffset.Value;

    var isPlanksTop = (propTopType.ItemIndex === 0);
    var isSolidTop = (propTopType.ItemIndex === 1);
    var isThroughBottom = (propBottomType.ItemIndex === 0);

    var floorY = legH;

    // -------------------------------------------------------------------------
    // А. ДНО МОДУЛЯ
    // -------------------------------------------------------------------------
    var dno;
    if (isThroughBottom) {
        dno = AddHorizPanel(0, 0, width, depth, floorY);
    } else {
        dno = AddHorizPanel(thick, 0, width - thick, depth, floorY);
    }
    dno.Name = 'Дно';
    dno.AddButt(propEdgeFront, 1); // Лицевой - 0.8 мм
    dno.AddButt(propEdgeBody, 0);  // Левый - 0.4 мм
    dno.AddButt(propEdgeBody, 2);  // Правый - 0.4 мм
    dno.AddButt(propEdgeBody, 3);  // Задний - 0.4 мм

    // Точки центров 4 ножек:
    var legPoints = [
        { x: sideOffset, z: depth - frontOffset, name: 'Ножка передняя левая' },
        { x: width - sideOffset, z: depth - frontOffset, name: 'Ножка передняя правая' },
        { x: sideOffset, z: backOffset, name: 'Ножка задняя левая' },
        { x: width - sideOffset, z: backOffset, name: 'Ножка задняя правая' }
    ];

    // Если включена опция сквозных отверстий d=10 мм под регулировку изнутри:
    if (propThroughHole.Value) {
        for (var h = 0; h < legPoints.length; h++) {
            var lp = legPoints[h];
            dno.Contour.AddCircle(lp.x, lp.z, 5); // радиус 5 = диаметр 10 мм
        }
    }
    dno.Build();

    // -------------------------------------------------------------------------
    // Б. БОКОВИНЫ
    // -------------------------------------------------------------------------
    var sideY1 = isThroughBottom ? (floorY + thick) : floorY;
    var sideY2 = isSolidTop ? (floorY + bodyHeight - thick) : (floorY + bodyHeight);

    // Левая боковина
    var levBok = AddVertPanel(0, sideY1, depth, sideY2, 0);
    levBok.Name = 'Боковина левая';
    levBok.AddButt(propEdgeFront, 1);
    levBok.AddButt(propEdgeBody, 0);
    levBok.AddButt(propEdgeBody, 2);
    levBok.AddButt(propEdgeBody, 3);
    levBok.Build();

    // Правая боковина
    var pravBok = AddVertPanel(0, sideY1, depth, sideY2, width - thick);
    pravBok.Name = 'Боковина правая';
    pravBok.AddButt(propEdgeFront, 1);
    pravBok.AddButt(propEdgeBody, 0);
    pravBok.AddButt(propEdgeBody, 2);
    pravBok.AddButt(propEdgeBody, 3);
    pravBok.Build();

    // -------------------------------------------------------------------------
    // В. ВЕРХ (ДВЕ ПЛАНКИ ПО 80 мм ПОД СТОЛЕШНИЦУ ИЛИ СПЛОШНАЯ КРЫШКА)
    // -------------------------------------------------------------------------
    if (isPlanksTop) {
        var pWidth = propPlankWidth.Value || 80;

        // Передняя планка (царга) плашмя вровень с верхом боковин
        var plPer = AddHorizPanel(thick, depth - pWidth, width - thick, depth, floorY + bodyHeight - thick);
        plPer.Name = 'Планка столешницы передняя (царга)';
        plPer.AddButt(propEdgeFront, 1); // Передний край - фасадная кромка 0.8
        plPer.AddButt(propEdgeBody, 3);  // Внутренний край - корпусная 0.4
        plPer.Build();

        // Задняя планка (царга) плашмя у задней стенки
        var plZad = AddHorizPanel(thick, 0, width - thick, pWidth, floorY + bodyHeight - thick);
        plZad.Name = 'Планка столешницы задняя (царга)';
        plZad.AddButt(propEdgeBody, 1);
        plZad.AddButt(propEdgeBody, 3);
        plZad.Build();
    } else {
        var krishka = AddHorizPanel(0, 0, width, depth, floorY + bodyHeight - thick);
        krishka.Name = 'Крышка (горизонт)';
        krishka.AddButt(propEdgeFront, 1);
        krishka.AddButt(propEdgeBody, 0);
        krishka.AddButt(propEdgeBody, 2);
        krishka.AddButt(propEdgeBody, 3);
        krishka.Build();
    }

    // -------------------------------------------------------------------------
    // Г. СЪЕМНАЯ ПОЛКА
    // -------------------------------------------------------------------------
    if (propHasShelf.Value) {
        var shelfY = floorY + thick + (sideY2 - sideY1 - thick) / 2;
        var shelfDepth = depth - 20;
        var polka = AddHorizPanel(thick, 0, width - thick, shelfDepth, shelfY);
        polka.Name = 'Полка съемная';
        polka.AddButt(propEdgeFront, 1);
        polka.AddButt(propEdgeBody, 3);
        polka.Build();
    }

    // -------------------------------------------------------------------------
    // Д. ЗАДНЯЯ СТЕНКА (ХДФ 4 мм)
    // -------------------------------------------------------------------------
    if (propHasBack.Value) {
        var backY1 = floorY + (isThroughBottom ? thick : 0);
        var backY2 = floorY + bodyHeight;
        var zadStenka = AddFrontPanel(0, backY1, width, backY2, 0);
        zadStenka.Name = 'Задняя стенка (ХДФ)';
        zadStenka.Thickness = 4;
        zadStenka.Build();
    }

    // -------------------------------------------------------------------------
    // Е. МОНТАЖ НОЖЕК (полная ножка с 4-мя цилиндрами d=5x12 мм)
    // -------------------------------------------------------------------------
    var legPath = getLegPathByChoice(propLegModel.ItemIndex, legH);
    var legModel = null;
    
    try {
        legModel = OpenFurniture(legPath);
    } catch (e) {
        legModel = null;
    }

    for (var l = 0; l < legPoints.length; l++) {
        var lp = legPoints[l];
        var mountedSuccess = false;

        if (legModel && dno) {
            try {
                // Монтируем фурнитуру снизу на плоскость дна
                legModel.Mount1(dno, lp.x, -legH, lp.z, 0);
                mountedSuccess = true;
            } catch (err) {
                mountedSuccess = false;
            }
        }

        if (!mountedSuccess) {
            var legBlock = BeginBlock(lp.name);
            var baseCyl = AddCylinder(NewVector(lp.x, floorY, lp.z), 40, -15);
            baseCyl.Name = 'База опоры';
            var stemCyl = AddCylinder(NewVector(lp.x, floorY - 15, lp.z), 15, -(legH - 25));
            stemCyl.Name = 'Стойка опоры';
            var footCyl = AddCylinder(NewVector(lp.x, 10, lp.z), 25, -10);
            footCyl.Name = 'Подпятник опоры';
            EndBlock();
        }
    }

    // -------------------------------------------------------------------------
    // Ж. ФАСАДЫ (ДВЕРИ) И ПЕТЛИ ПО СТАНДАРТУ (отступ 1.5 мм, зазор 3.0 мм)
    // -------------------------------------------------------------------------
    var doorChoice = propDoorType.ItemIndex;
    if (doorChoice !== 3) { // Не "Без дверей"
        var gap = propDoorGap.Value || 1.5;
        var doorThick = thick;
        var doorH = bodyHeight - 2 * gap;
        var doorY = floorY + gap;
        var doorZ = depth;

        var doorsToMake = [];

        if (doorChoice === 0) {
            // 2 двери: ширина каждой = (width - 2*gap - 3.0) / 2
            var doorW = (width - 2 * gap - 3.0) / 2;
            doorsToMake.push({
                name: 'Фасад левый',
                x1: gap,
                x2: gap + doorW,
                hingeSide: 'left',
                post: levBok
            });
            doorsToMake.push({
                name: 'Фасад правый',
                x1: width - gap - doorW,
                x2: width - gap,
                hingeSide: 'right',
                post: pravBok
            });
        } else if (doorChoice === 1) {
            // 1 дверь левая: ширина = width - 2*gap
            var doorW = width - 2 * gap;
            doorsToMake.push({
                name: 'Фасад (петли слева)',
                x1: gap,
                x2: gap + doorW,
                hingeSide: 'left',
                post: levBok
            });
        } else if (doorChoice === 2) {
            // 1 дверь правая: ширина = width - 2*gap
            var doorW = width - 2 * gap;
            doorsToMake.push({
                name: 'Фасад (петли справа)',
                x1: gap,
                x2: gap + doorW,
                hingeSide: 'right',
                post: pravBok
            });
        }

        // Поиск настроенной петли "петля МОЯ"
        var hingeObj = null;
        if (propHinges.Value) {
            var hingePaths = [
                'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Петли\\петля_моя.f3d',
                'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\петля_моя.f3d',
                'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\Петли без заглушек и крестообр. планка\\Петля_CLIP top, CLIP без заглушек\\петля МОЯ.f3d'
            ];
            for (var hp = 0; hp < hingePaths.length; hp++) {
                if (system.fileExists(hingePaths[hp])) {
                    try {
                        hingeObj = OpenFurniture(hingePaths[hp]);
                        if (hingeObj) break;
                    } catch (eH) {}
                }
            }
        }

        for (var dIdx = 0; dIdx < doorsToMake.length; dIdx++) {
            var dInfo = doorsToMake[dIdx];
            var doorPanel = AddFrontPanel(dInfo.x1, doorY, dInfo.x2, doorY + doorH, doorZ);
            doorPanel.Name = dInfo.name;
            doorPanel.Thickness = doorThick;
            doorPanel.AddButt(propEdgeFront, 0);
            doorPanel.AddButt(propEdgeFront, 1);
            doorPanel.AddButt(propEdgeFront, 2);
            doorPanel.AddButt(propEdgeFront, 3);
            doorPanel.Build();

            // Монтаж петель (строго 70 мм от низа и 70 мм от верха двери)
            if (hingeObj && dInfo.post) {
                var hingeYBottom = doorY + 70;
                var hingeYTop = doorY + doorH - 70;
                var mountX = (dInfo.hingeSide === 'left') ? thick : (width - thick);

                try {
                    hingeObj.Mount(dInfo.post, doorPanel, mountX, hingeYBottom, depth);
                    hingeObj.Mount(dInfo.post, doorPanel, mountX, hingeYTop, depth);
                } catch (eMount) {}
            }

            // Ручка на фасад (горизонтальная ручка-скоба)
            if (propHandles.Value) {
                var handleBlock = BeginBlock('Ручка ' + dInfo.name);
                var handleH = 128;
                var handleMargin = 40;
                var handleX = (dInfo.hingeSide === 'left') ? (dInfo.x2 - handleMargin - handleH / 2) : (dInfo.x1 + handleMargin + handleH / 2);
                var handleY = doorY + doorH - 80; // 80 мм от верхнего края двери
                var handleZ = doorZ + doorThick + 25;

                // Ручка
                var bar = AddCylinder(NewVector(handleX - handleH / 2, handleY, handleZ), 6, handleH);
                var leg1 = AddCylinder(NewVector(handleX - handleH / 2, handleY, doorZ + doorThick), 5, 25);
                var leg2 = AddCylinder(NewVector(handleX + handleH / 2, handleY, doorZ + doorThick), 5, 25);
                EndBlock();
            }
        }
    }

    ViewAll();
    SetCamera(p3dIsometric);
}

btnBuild.OnClick = function() {
    buildKitchenBase();
};

btnFinish.OnClick = function() {
    buildKitchenBase();
    Action.Commit();
    Action.Finish();
};

prop.OnChange = function() {
    buildKitchenBase();
};

buildKitchenBase();
Action.Continue();
