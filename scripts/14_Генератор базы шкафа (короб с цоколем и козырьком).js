/**
 * =============================================================================
 * 14_Генератор базы шкафа (короб с цоколями и козырьком)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Конструкция короба шкафа:
 * 1. Боковины идут ДО ПОЛА (Y = 0..H).
 * 2. Цоколь спереди: высота 60 мм (Y = 0..60).
 * 3. Цоколь сзади: высота 60 мм (Y = 0..60), смещен от задней кромки на 80 мм (под плинтус).
 * 4. Дно: лежит НА цоколях (Y = 60 мм), вкладное между боковинами.
 * 5. Козырек сверху: высота 65 мм (планка козырька / фальшпанель под направляющие купе).
 * 6. Крышка: вкладная между боковинами.
 * 7. Панели: все 16 мм (настраивается).
 * 
 * Назначение:
 * Генерация чистого, геометрически точного каркаса шкафа без лишней фурнитуры,
 * чтобы конструктор мог расставить свой крепеж (евровинты, эксцентрики VB/Rafix),
 * настроить плоскости эластичности и сохранить как мастер-фрагмент шкафа.
 * =============================================================================
 */

var Prop = Action.Properties;
Prop.Clear();

// [Группа 1: Габариты шкафа]
var grSize = Prop.NewGroup('1. Габариты шкафа (короба)');

var pWidth = grSize.NewNumber('Ширина W, мм', 1000);
pWidth.MinValue = 300;
pWidth.MaxValue = 3000;

var pHeight = grSize.NewNumber('Высота H, мм', 2400);
pHeight.MinValue = 1000;
pHeight.MaxValue = 3200;

var pDepth = grSize.NewNumber('Глубина D, мм', 560);
pDepth.MinValue = 300;
pDepth.MaxValue = 1200;

var pThick = grSize.NewNumber('Толщина ЛДСП, мм', 16);
pThick.MinValue = 10;
pThick.MaxValue = 30;

// [Группа 2: Цокольный узел]
var grSocle = Prop.NewGroup('2. Цокольный узел (основание)');

var pSocleHeight = grSocle.NewNumber('Высота цоколей, мм', 60);
pSocleHeight.MinValue = 30;
pSocleHeight.MaxValue = 200;

var pSocleRearOffset = grSocle.NewNumber('Отступ заднего цоколя (под плинтус), мм', 80);
pSocleRearOffset.MinValue = 0;
pSocleRearOffset.MaxValue = 250;

var pSocleFrontOffset = grSocle.NewNumber('Отступ переднего цоколя от переда, мм', 0);
pSocleFrontOffset.MinValue = 0;
pSocleFrontOffset.MaxValue = 100;

// [Группа 3: Верх и козырек]
var grTop = Prop.NewGroup('3. Верх и козырек');

var pVisorHeight = grTop.NewNumber('Высота козырька, мм', 65);
pVisorHeight.MinValue = 0;
pVisorHeight.MaxValue = 250;

var pVisorType = grTop.NewCombo('Конструкция верха',
    'Крышка под козырьком (козырек 65 мм вровень с верхом боковин)\n' +
    'Крышка по верху боковин (козырек 65 мм опущен под крышку)\n' +
    'Без козырька (только верхняя крышка)'
);
pVisorType.ItemIndex = 0;

var pVisorOffset = grTop.NewNumber('Отступ козырька от лицевой кромки, мм', 0);
pVisorOffset.MinValue = 0;
pVisorOffset.MaxValue = 100;

// [Группа 4: Внутреннее деление (опционально)]
var grDiv = Prop.NewGroup('4. Внутреннее деление (опционально)');

var pDivType = grDiv.NewCombo('Перегородки и полки',
    'Чистый короб шкафа (без наполнения)\n' +
    'Со средней стойкой (2 равные секции)\n' +
    'Со средней стойкой и антресольной полкой'
);
pDivType.ItemIndex = 0;

var pMezzanineHeight = grDiv.NewNumber('Высота антресольного проема, мм', 400);
pMezzanineHeight.MinValue = 150;
pMezzanineHeight.MaxValue = 800;

var pLeftSectionWidth = grDiv.NewNumber('Ширина левой секции, мм (0 = пополам)', 0);
pLeftSectionWidth.MinValue = 0;
pLeftSectionWidth.MaxValue = 2000;

// [Группа 5: Задняя стенка]
var grBack = Prop.NewGroup('5. Задняя стенка (ХДФ 4 мм)');

var pBackWall = grBack.NewCombo('Задняя стенка',
    'Накладная сзади (отступ 2 мм по периметру)\n' +
    'В четверть / паз\n' +
    'Без задней стенки'
);
pBackWall.ItemIndex = 0;

// [Группа 6: Материалы и кромка]
var grMat = Prop.NewGroup('6. Материалы и кромка');
var pMatBody = grMat.NewMaterial('Материал корпуса (ЛДСП 16 мм)');
var pMatBack = grMat.NewMaterial('Материал задней стенки (ХДФ 4 мм)');
var pEdgeFront = grMat.NewButt('Кромка лицевая передняя (0.8 мм)');
var pEdgeBody = grMat.NewButt('Кромка корпусная (0.4 мм)');

// [Группа 7: Действия]
var grActions = Prop.NewGroup('7. Действия');
var btnBuild = grActions.NewButton('Сгенерировать базу шкафа');
var btnFinish = grActions.NewButton('Готово (сохранить)');

function buildWardrobeBase() {
    DeleteNewObjects();

    pMatBody.SetActive();
    var thick = pThick.Value || ActiveMaterial.Thickness || 16;
    if (!thick || thick <= 0) thick = 16;

    var W = pWidth.Value;
    var H = pHeight.Value;
    var D = pDepth.Value;

    var socleH = pSocleHeight.Value;
    var rearOffset = pSocleRearOffset.Value;
    var frontOffset = pSocleFrontOffset.Value;

    var visorH = pVisorHeight.Value;
    var visorType = pVisorType.ItemIndex;
    var visorOffset = pVisorOffset.Value;

    var divType = pDivType.ItemIndex;
    var mezH = pMezzanineHeight.Value;
    var leftW = pLeftSectionWidth.Value;

    var baseBlock = BeginBlock('База шкафа ' + W + 'x' + D + 'x' + H);

    // =========================================================================
    // 1. БОКОВИНЫ (идут до пола: Y = 0..H)
    // =========================================================================
    var levBok = AddVertPanel(0, 0, D, H, 0);
    levBok.Name = 'Боковина левая';
    levBok.Thickness = thick;
    levBok.AddButt(pEdgeBody, 0);   // низ (к полу)
    levBok.AddButt(pEdgeFront, 1);  // передний торец
    levBok.AddButt(pEdgeBody, 2);   // верхний торец
    levBok.AddButt(pEdgeBody, 3);   // задний торец
    levBok.Build();

    var pravBok = AddVertPanel(0, 0, D, H, W - thick);
    pravBok.Name = 'Боковина правая';
    pravBok.Thickness = thick;
    pravBok.AddButt(pEdgeBody, 0);   // низ (к полу)
    pravBok.AddButt(pEdgeFront, 1);  // передний торец
    pravBok.AddButt(pEdgeBody, 2);   // верхний торец
    pravBok.AddButt(pEdgeBody, 3);   // задний торец
    pravBok.Build();

    // =========================================================================
    // 2. ЦОКОЛИ (передний и задний со смещением на 80 мм)
    // =========================================================================
    var frontSocleZ = D - thick - frontOffset;
    var frontSocle = AddFrontPanel(thick, 0, W - thick, socleH, frontSocleZ);
    frontSocle.Name = 'Цоколь передний';
    frontSocle.Thickness = thick;
    frontSocle.AddButt(pEdgeBody, 0); // к полу
    frontSocle.AddButt(pEdgeBody, 2); // к дну
    frontSocle.Build();

    var backSocle = AddFrontPanel(thick, 0, W - thick, socleH, rearOffset);
    backSocle.Name = 'Цоколь задний';
    backSocle.Thickness = thick;
    backSocle.AddButt(pEdgeBody, 0); // к полу
    backSocle.AddButt(pEdgeBody, 2); // к дну
    backSocle.Build();

    // =========================================================================
    // 3. ДНО (лежит на цоколях, Y = socleH, вкладное между боковинами)
    // =========================================================================
    var dno = AddHorizPanel(thick, 0, W - thick, D, socleH);
    dno.Name = 'Дно';
    dno.Thickness = thick;
    dno.AddButt(pEdgeFront, 1); // передний торец
    dno.AddButt(pEdgeBody, 3);  // задний торец
    dno.Build();

    // =========================================================================
    // 4. КРЫШКА И КОЗЫРЕК (65 мм)
    // =========================================================================
    var roofY = H - thick;
    if (visorType === 0) {
        // Крышка под козырьком: верх козырька = H, низ козырька = H - visorH
        // Крышка лежит прямо под козырьком: Y = H - visorH - thick
        roofY = H - visorH - thick;
        var krishka = AddHorizPanel(thick, 0, W - thick, D, roofY);
        krishka.Name = 'Крышка';
        krishka.Thickness = thick;
        krishka.AddButt(pEdgeFront, 1);
        krishka.AddButt(pEdgeBody, 3);
        krishka.Build();

        if (visorH > 0) {
            var visorZ = D - thick - visorOffset;
            var visor = AddFrontPanel(thick, H - visorH, W - thick, H, visorZ);
            visor.Name = 'Козырек (фальшпанель)';
            visor.Thickness = thick;
            visor.AddButt(pEdgeFront, 0); // нижний лицевой торец
            visor.AddButt(pEdgeBody, 2);  // верхний торец
            visor.Build();
        }
    } else if (visorType === 1) {
        // Крышка по верху боковин: Y = H - thick
        // Козырек опущен под крышку на visorH
        roofY = H - thick;
        var krishka = AddHorizPanel(thick, 0, W - thick, D, roofY);
        krishka.Name = 'Крышка';
        krishka.Thickness = thick;
        krishka.AddButt(pEdgeFront, 1);
        krishka.AddButt(pEdgeBody, 3);
        krishka.Build();

        if (visorH > 0) {
            var visorZ = D - thick - visorOffset;
            var visor = AddFrontPanel(thick, H - thick - visorH, W - thick, H - thick, visorZ);
            visor.Name = 'Козырек (планка)';
            visor.Thickness = thick;
            visor.AddButt(pEdgeFront, 0); // нижний лицевой торец
            visor.Build();
        }
    } else {
        // Без козырька: только крышка по верху
        roofY = H - thick;
        var krishka = AddHorizPanel(thick, 0, W - thick, D, roofY);
        krishka.Name = 'Крышка';
        krishka.Thickness = thick;
        krishka.AddButt(pEdgeFront, 1);
        krishka.AddButt(pEdgeBody, 3);
        krishka.Build();
    }

    // =========================================================================
    // 5. ВНУТРЕННЕЕ ДЕЛЕНИЕ (опционально)
    // =========================================================================
    var dnoSurfaceY = socleH + thick; // 60 + 16 = 76 мм

    if (divType === 1) {
        // Со средней стойкой от дна до крышки
        var innerH = roofY - dnoSurfaceY;
        var midX = (leftW > 0) ? (thick + leftW) : (W / 2 - thick / 2);

        var midPost = AddVertPanel(0, dnoSurfaceY, D, roofY, midX);
        midPost.Name = 'Стойка средняя';
        midPost.Thickness = thick;
        midPost.AddButt(pEdgeFront, 1);
        midPost.AddButt(pEdgeBody, 3);
        midPost.Build();
    } else if (divType === 2) {
        // Со средней стойкой и антресольной полкой
        var topShelfY = roofY - mezH - thick;

        var mezShelf = AddHorizPanel(thick, 0, W - thick, D, topShelfY);
        mezShelf.Name = 'Полка антресольная';
        mezShelf.Thickness = thick;
        mezShelf.AddButt(pEdgeFront, 1);
        mezShelf.AddButt(pEdgeBody, 3);
        mezShelf.Build();

        var midX = (leftW > 0) ? (thick + leftW) : (W / 2 - thick / 2);
        var midPost = AddVertPanel(0, dnoSurfaceY, D, topShelfY, midX);
        midPost.Name = 'Стойка средняя';
        midPost.Thickness = thick;
        midPost.AddButt(pEdgeFront, 1);
        midPost.AddButt(pEdgeBody, 3);
        midPost.Build();
    }

    // =========================================================================
    // 6. ЗАДНЯЯ СТЕНКА (ХДФ 4 мм)
    // =========================================================================
    if (pBackWall.ItemIndex === 0) {
        pMatBack.SetActive();
        var backWall = AddFrontPanel(2, 2, W - 2, H - 2, -4);
        backWall.Name = 'Задняя стенка (ХДФ)';
        backWall.Thickness = 4;
        backWall.Build();
    } else if (pBackWall.ItemIndex === 1) {
        pMatBack.SetActive();
        var backWall = AddFrontPanel(thick, socleH, W - thick, roofY, 12);
        backWall.Name = 'Задняя стенка (ХДФ в четверть)';
        backWall.Thickness = 4;
        backWall.Build();
    }

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
}

btnBuild.OnClick = function() {
    buildWardrobeBase();
};

btnFinish.OnClick = function() {
    buildWardrobeBase();
    Action.Commit();
    Action.Finish();
    alert('База шкафа успешно построена!\n\n' +
          'Конструкция короба:\n' +
          '• Боковины: идут до самого пола (Y = 0..H)\n' +
          '• Цоколи: передний (60 мм) и задний (60 мм с отступом 80 мм под плинтус)\n' +
          '• Дно: опирается на цоколи (Y = 60 мм), вкладное между боковинами\n' +
          '• Козырек сверху: 65 мм (планка фальшпанели)\n\n' +
          'Теперь вы можете расставить свои евровинты, эксцентрики (VB / Rafix), ' +
          'настроить плоскости эластичности и сохранить как фрагмент "Шкаф Базовый.fr3d".');
};

Prop.OnChange = function() {
    buildWardrobeBase();
};

buildWardrobeBase();
Action.Continue();
