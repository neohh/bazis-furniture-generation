// =============================================================================
// Базис-Мебельщик: Генератор нижнего кухонного модуля (базы) с ножками под цоколь
// Соответствует стандартам кухонного конструирования (евростандарт)
// =============================================================================

var FileOptions = 'Kitchen_Base_Config.xml';

// 1. Поиск файла кухонной ножки в доступных библиотеках
function findLegModelPath(height) {
    var candidatePaths = [
        'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Ножки для кухни под цоколь\\VOLPATO\\Ножка под цоколь H.' + height + ' разборная, черная.f3d',
        'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Ножки_для_кухни_под_цоколь\\VOLPATO\\Ножка под цоколь H.' + height + ' разборная, черная.f3d',
        'Z:\\Work\\генерация мебели\\Фурнитура\\Ножки для кухни под цоколь\\VOLPATO\\Ножка под цоколь H.' + height + ' разборная, черная.f3d',
        'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Ножки для кухни под цоколь\\VOLPATO\\Ножка под цоколь H.100 разборная, черная.f3d'
    ];

    for (var i = 0; i < candidatePaths.length; i++) {
        var p = candidatePaths[i];
        if (system.fileExists(p)) {
            return p;
        }
    }
    return candidatePaths[0];
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
propLegHeight.ItemIndex = 0; // 100 мм по умолчанию

// Группа 2: Конструкция верха и полок
var grConst = prop.NewGroup('Конструкция каркаса');
var propTopType = grConst.NewCombo('Верх модуля', 'Сплошная крышка (горизонт)\nПланки под столешницу (царги)');
propTopType.ItemIndex = 0; // Сплошная крышка как на фото

var propBottomType = grConst.NewCombo('Тип дна', 'Проходное дно (боковины на дне)\nВкладное дно (между боковин)');
propBottomType.ItemIndex = 0; // Проходное дно - стандарт кухни

var propHasShelf = grConst.NewBool('Съемная полка', true);
var propHasBack = grConst.NewBool('Задняя стенка (ХДФ 4 мм)', true);

// Группа 3: Отступы ножек (под цоколь)
var grLegs = prop.NewGroup('Привязка кухонных ножек');
var propLegFrontOffset = grLegs.NewNumber('Отступ передних ножек (мм)', 60);
var propLegBackOffset = grLegs.NewNumber('Отступ задних ножек (мм)', 50);
var propLegSideOffset = grLegs.NewNumber('Отступ ножек с боков (мм)', 50);
var propMountLegs3D = grLegs.NewBool('Устанавливать 3D ножки', true);

// Группа 4: Материалы и кромка
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

    var isSolidTop = (propTopType.ItemIndex === 0);
    var isThroughBottom = (propBottomType.ItemIndex === 0);

    var floorY = legH; // Нижняя плоскость дна находится на высоте ножек

    // -------------------------------------------------------------------------
    // А. ДНО МОДУЛЯ
    // -------------------------------------------------------------------------
    var dno;
    if (isThroughBottom) {
        // Проходное дно на всю ширину W x D
        dno = AddHorizPanel(0, 0, width, depth, floorY);
    } else {
        // Вкладное дно между боковинами
        dno = AddHorizPanel(thick, 0, width - thick, depth, floorY);
    }
    dno.Name = 'Дно';
    dno.AddButt(propEdgeFront, 1); // Передний торец - 0.8 мм
    dno.AddButt(propEdgeBody, 0);  // Левый - 0.4 мм
    dno.AddButt(propEdgeBody, 2);  // Правый - 0.4 мм
    dno.AddButt(propEdgeBody, 3);  // Задний - 0.4 мм
    dno.Build();

    // -------------------------------------------------------------------------
    // Б. БОКОВИНЫ (ЛЕВАЯ И ПРАВАЯ)
    // -------------------------------------------------------------------------
    var sideY1, sideY2;
    if (isThroughBottom) {
        sideY1 = floorY + thick; // Боковина стоит сверху на дне
    } else {
        sideY1 = floorY;         // Боковина спускается до уровня ножек
    }

    if (isSolidTop) {
        sideY2 = floorY + bodyHeight - thick; // Под сплошную крышку
    } else {
        sideY2 = floorY + bodyHeight;         // До самого верха под планки-царги
    }

    // Левая боковина (X = 0)
    var levBok = AddVertPanel(0, sideY1, depth, sideY2, 0);
    levBok.Name = 'Боковина левая';
    levBok.AddButt(propEdgeFront, 1); // Передний торец - 0.8 мм
    levBok.AddButt(propEdgeBody, 0);  // Низ - 0.4 мм
    levBok.AddButt(propEdgeBody, 2);  // Верх - 0.4 мм
    levBok.AddButt(propEdgeBody, 3);  // Задний торец - 0.4 мм
    levBok.Build();

    // Правая боковина (X = width - thick)
    var pravBok = AddVertPanel(0, sideY1, depth, sideY2, width - thick);
    pravBok.Name = 'Боковина правая';
    pravBok.AddButt(propEdgeFront, 1);
    pravBok.AddButt(propEdgeBody, 0);
    pravBok.AddButt(propEdgeBody, 2);
    pravBok.AddButt(propEdgeBody, 3);
    pravBok.Build();

    // -------------------------------------------------------------------------
    // В. ВЕРХ МОДУЛЯ (КРЫШКА ИЛИ ЦАРГИ)
    // -------------------------------------------------------------------------
    if (isSolidTop) {
        // Сплошная крышка на весь модуль
        var krishka = AddHorizPanel(0, 0, width, depth, floorY + bodyHeight - thick);
        krishka.Name = 'Крышка (горизонт)';
        krishka.AddButt(propEdgeFront, 1);
        krishka.AddButt(propEdgeBody, 0);
        krishka.AddButt(propEdgeBody, 2);
        krishka.AddButt(propEdgeBody, 3);
        krishka.Build();
    } else {
        // Две кухонные царги (стяжные планки под столешницу)
        var plankWidth = 80; // Стандарт ширины планки 80 мм
        
        // Передняя планка
        var plPer = AddHorizPanel(thick, depth - plankWidth, width - thick, depth, floorY + bodyHeight - thick);
        plPer.Name = 'Планка столешницы передняя';
        plPer.AddButt(propEdgeBody, 1);
        plPer.AddButt(propEdgeBody, 3);
        plPer.Build();

        // Задняя планка
        var plZad = AddHorizPanel(thick, 0, width - thick, plankWidth, floorY + bodyHeight - thick);
        plZad.Name = 'Планка столешницы задняя';
        plZad.AddButt(propEdgeBody, 1);
        plZad.AddButt(propEdgeBody, 3);
        plZad.Build();
    }

    // -------------------------------------------------------------------------
    // Г. СЪЕМНАЯ ВНУТРЕННЯЯ ПОЛКА
    // -------------------------------------------------------------------------
    if (propHasShelf.Value) {
        var shelfY = floorY + thick + (sideY2 - sideY1 - thick) / 2;
        var shelfDepth = depth - 20; // Отступ 20 мм спереди под петли и фасад!
        
        var polka = AddHorizPanel(thick, 0, width - thick, shelfDepth, shelfY);
        polka.Name = 'Полка съемная';
        polka.AddButt(propEdgeFront, 1); // Передний рабочий торец - 0.8 мм
        polka.AddButt(propEdgeBody, 3);  // Задний - 0.4 мм
        polka.Build();
    }

    // -------------------------------------------------------------------------
    // Д. ЗАДНЯЯ СТЕНКА (ХДФ 4 мм)
    // -------------------------------------------------------------------------
    if (propHasBack.Value) {
        var backThick = 4;
        var backY1 = floorY + (isThroughBottom ? thick : 0);
        var backY2 = floorY + bodyHeight;
        
        var zadStenka = AddFrontPanel(0, backY1, width, backY2, 0);
        zadStenka.Name = 'Задняя стенка (ХДФ)';
        zadStenka.Thickness = backThick;
        zadStenka.Build();
    }

    // -------------------------------------------------------------------------
    // Е. КУХОННЫЕ НОЖКИ (4 шт. под цоколь)
    // -------------------------------------------------------------------------
    if (propMountLegs3D.Value) {
        var legPath = findLegModelPath(legH);
        var legModel = null;
        
        try {
            legModel = OpenFurniture(legPath);
        } catch (e) {
            legModel = null;
        }

        // Центры 4 ножек:
        // X: sideOffset (слева) и width - sideOffset (справа)
        // Z: depth - frontOffset (спереди) и backOffset (сзади)
        var legPoints = [
            { x: sideOffset, z: depth - frontOffset, name: 'Ножка передняя левая' },
            { x: width - sideOffset, z: depth - frontOffset, name: 'Ножка передняя правая' },
            { x: sideOffset, z: backOffset, name: 'Ножка задняя левая' },
            { x: width - sideOffset, z: backOffset, name: 'Ножка задняя правая' }
        ];

        for (var l = 0; l < legPoints.length; l++) {
            var lp = legPoints[l];
            var mountedSuccess = false;

            if (legModel && dno) {
                try {
                    // Установка фурнитуры на плоскость дна
                    // Mount1(панель, X_вдоль_длины, Y_смещение, Z_вдоль_ширины, угол)
                    legModel.Mount1(dno, lp.x, -legH, lp.z, 0);
                    mountedSuccess = true;
                } catch (err) {
                    mountedSuccess = false;
                }
            }

            // Надежный визуальный fallback, если 3D-файл не найден:
            if (!mountedSuccess) {
                var legBlock = BeginBlock(lp.name);
                // База ножки (d=80 мм, h=15 мм)
                var baseCyl = AddCylinder(NewVector(lp.x, floorY, lp.z), 40, -15);
                baseCyl.Name = 'База опоры';
                // Стержень ножки (d=30 мм, h=legH-15)
                var stemCyl = AddCylinder(NewVector(lp.x, floorY - 15, lp.z), 15, -(legH - 25));
                stemCyl.Name = 'Стойка опоры';
                // Подпятник ножки (d=50 мм, h=10 мм)
                var footCyl = AddCylinder(NewVector(lp.x, 10, lp.z), 25, -10);
                footCyl.Name = 'Подпятник опоры';
                EndBlock();
            }
        }
    }

    ViewAll();
    SetCamera(p3dIsometric);
}

// 4. Назначение обработчиков
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

// Запуск первичного построения сразу при старте
buildKitchenBase();
Action.Continue();
