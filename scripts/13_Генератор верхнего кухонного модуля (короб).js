/**
 * =============================================================================
 * Генератор базового короба верхнего кухонного модуля (навесного шкафа)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Назначение:
 * Генерация чистого, идеально выверенного каркаса (короба) верхнего модуля
 * кухни без фасадов и лишней фурнитуры.
 * 
 * Вы можете:
 * 1. Запустить скрипт и получить чистый короб верхнего шкафа (700х500х720 мм).
 * 2. Расставить на нем свои евровинты, навесы и крепеж так, как вам нужно.
 * 3. Назначить плоскости эластичности по осям X, Y, Z.
 * 4. Сохранить его как фрагмент (например, "Верхняя база.fr3d"),
 *    после чего скрипт быстрой расстановки ряда баз будет автоматически
 *    растягивать вашу готовую модель!
 * =============================================================================
 */

function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return paths[0];
}

var SHELF_SUPPORT_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Полкодержатели\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\полкодержатель_d5.f3d',
    'z:\\Work\\генерация мебели\\furn\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Полкодержатели\\Полкодержатель D5 никель.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Крепеж\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\полкодержатель_d5.f3d'
];

var shelfSupportPath = findFirstExistingFile(SHELF_SUPPORT_PATHS);
var shelfSupportObj = null;
if (system.fileExists(shelfSupportPath)) {
    try { shelfSupportObj = OpenFurniture(shelfSupportPath); } catch (eS) {}
}

var Prop = Action.Properties;
Prop.Clear();

// [Группа 1: Габариты короба]
var grSize = Prop.NewGroup('1. Габариты короба (навесного шкафа)');

var pWidth = grSize.NewNumber('Ширина W, мм', 700);
pWidth.MinValue = 200;
pWidth.MaxValue = 1400;

var pDepth = grSize.NewNumber('Глубина D, мм', 500);
pDepth.MinValue = 200;
pDepth.MaxValue = 800;

var pHeight = grSize.NewNumber('Высота H, мм', 720);
pHeight.MinValue = 300;
pHeight.MaxValue = 1500;

var pThick = grSize.NewNumber('Толщина ЛДСП, мм', 16);
pThick.MinValue = 10;
pThick.MaxValue = 30;

// [Группа 2: Конструкция каркаса и полок]
var grConst = Prop.NewGroup('2. Конструкция каркаса');

var pTopBottomType = grConst.NewCombo('Дно и крышка', 
    'Вкладные между боковинами (стандарт навесных)\n' +
    'Накладные по высоте (боковины между дном и крышкой)'
);
pTopBottomType.ItemIndex = 0;

var pShelves = grConst.NewCombo('Полки съемные', '2 полки\n1 полка\n3 полки\nБез полок');
pShelves.ItemIndex = 0;
try { pShelves.Value = '2 полки'; } catch(e) {}

var pInstallShelfSupp = grConst.NewBool('Полкодержатели d5 под полки', true);

var pShelfRecess = grConst.NewNumber('Заглубление полок от переда, мм', 15);
pShelfRecess.MinValue = 0;
pShelfRecess.MaxValue = 50;

var pBackWall = grConst.NewCombo('Задняя стенка (ХДФ 4 мм)', 
    'Накладная сзади (отступ 2 мм от края)\n' +
    'Без задней стенки'
);
pBackWall.ItemIndex = 0;

// [Группа 3: Материалы и кромка]
var grMat = Prop.NewGroup('3. Материалы и кромка');
var pMatBody = grMat.NewMaterial('Материал корпуса (ЛДСП 16 мм)');
var pMatBack = grMat.NewMaterial('Материал задней стенки (ХДФ 4 мм)');
var pEdgeFront = grMat.NewButt('Кромка лицевая передняя (0.8 мм)');
var pEdgeBody = grMat.NewButt('Кромка корпусная (0.4 мм)');

// [Группа 4: Действия]
var grActions = Prop.NewGroup('4. Действия');
var btnBuild = grActions.NewButton('Сгенерировать короб');
var btnFinish = grActions.NewButton('Готово (сохранить)');

function buildCarcass() {
    DeleteNewObjects();

    pMatBody.SetActive();
    var thick = pThick.Value || ActiveMaterial.Thickness || 16;
    var W = pWidth.Value;
    var D = pDepth.Value;
    var H = pHeight.Value;

    var isInset = (pTopBottomType.ItemIndex === 0);
    var recess = pShelfRecess.Value;

    var boxBlock = BeginBlock('Короб верхнего модуля ' + W + 'x' + D + 'x' + H);

    // 1. Боковины
    var sideY1 = isInset ? 0 : thick;
    var sideY2 = isInset ? H : (H - thick);

    var levBok = AddVertPanel(0, sideY1, D, sideY2, 0);
    levBok.Name = 'Боковина левая';
    levBok.Thickness = thick;
    levBok.AddButt(pEdgeBody, 0);
    levBok.AddButt(pEdgeFront, 1);
    levBok.AddButt(pEdgeBody, 2);
    levBok.AddButt(pEdgeBody, 3);
    levBok.Build();

    var pravBok = AddVertPanel(0, sideY1, D, sideY2, W - thick);
    pravBok.Name = 'Боковина правая';
    pravBok.Thickness = thick;
    pravBok.AddButt(pEdgeBody, 0);
    pravBok.AddButt(pEdgeFront, 1);
    pravBok.AddButt(pEdgeBody, 2);
    pravBok.AddButt(pEdgeBody, 3);
    pravBok.Build();

    // 2. Дно и Крышка
    var horizX1 = isInset ? thick : 0;
    var horizX2 = isInset ? (W - thick) : W;

    var dno = AddHorizPanel(horizX1, 0, horizX2, D, 0);
    dno.Name = 'Дно';
    dno.Thickness = thick;
    dno.AddButt(pEdgeBody, 0);
    dno.AddButt(pEdgeFront, 1);
    dno.AddButt(pEdgeBody, 2);
    dno.AddButt(pEdgeBody, 3);
    dno.Build();

    var krishka = AddHorizPanel(horizX1, 0, horizX2, D, H - thick);
    krishka.Name = 'Крышка';
    krishka.Thickness = thick;
    krishka.AddButt(pEdgeBody, 0);
    krishka.AddButt(pEdgeFront, 1);
    krishka.AddButt(pEdgeBody, 2);
    krishka.AddButt(pEdgeBody, 3);
    krishka.Build();

    // 3. Задняя стенка
    if (pBackWall.ItemIndex === 0) {
        pMatBack.SetActive();
        var backWall = AddFrontPanel(2, 2, W - 2, H - 2, -4);
        backWall.Name = 'Задняя стенка (ХДФ)';
        backWall.Thickness = 4;
        backWall.Build();
    }

    // 4. Полки съемные
    var numShelves = 2;
    var shVal = pShelves.Value || '';
    if (pShelves.ItemIndex === 1 || shVal.indexOf('1') === 0) numShelves = 1;
    else if (pShelves.ItemIndex === 2 || shVal.indexOf('3') === 0) numShelves = 3;
    else if (pShelves.ItemIndex === 3 || shVal.indexOf('Без') === 0) numShelves = 0;

    if (numShelves > 0) {
        pMatBody.SetActive();
        var innerH = (H - thick) - thick;
        var shelfStep = innerH / (numShelves + 1);
        var shelfZ2 = D - recess;

        for (var s = 1; s <= numShelves; s++) {
            var shY = thick + s * shelfStep - thick / 2;
            var polka = AddHorizPanel(thick + 1, 0, W - thick - 1, shelfZ2, shY);
            polka.Name = 'Полка вкладная ' + s;
            polka.Thickness = thick;
            polka.AddButt(pEdgeBody, 1);
            polka.Build();

            if (pInstallShelfSupp.Value && shelfSupportObj) {
                var pY = polka.GabMin.y;
                var pZ1 = polka.GabMin.z + 64;
                var pZ2 = polka.GabMax.z - 40;
                if (pZ2 <= pZ1) {
                    pZ1 = polka.GabMin.z + 32;
                    pZ2 = polka.GabMax.z - 32;
                }
                try {
                    // В БАЗИС первый аргумент - горизонтальная полка, второй - вертикальная боковина
                    shelfSupportObj.Mount(polka, levBok, polka.GabMin.x, pY, pZ1);
                    shelfSupportObj.Mount(polka, pravBok, polka.GabMax.x, pY, pZ1);
                    shelfSupportObj.Mount(polka, levBok, polka.GabMin.x, pY, pZ2);
                    shelfSupportObj.Mount(polka, pravBok, polka.GabMax.x, pY, pZ2);
                } catch(eShM3) {}
            }
        }
    }

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
}

btnBuild.OnClick = function() {
    buildCarcass();
};

btnFinish.OnClick = function() {
    buildCarcass();
    Action.Commit();
    Action.Finish();
    alert('Короб верхнего модуля успешно сгенерирован!\n\n' +
          'Теперь вы можете расставить свои евровинты, навесы, настроить плоскости эластичности ' +
          'и сохранить как фрагмент "Верхняя база.fr3d".');
};

Prop.OnChange = function() {
    buildCarcass();
};

buildCarcass();
Action.Continue();
