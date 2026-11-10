/**
 * Параметрическое наполнение секций (полки и выдвижные ящики по рамке ниши)
 * Для БАЗИС-Мебельщик (версии 8, 9, 10, 11, 2021-2024)
 * 
 * Назначение:
 * 1. Интерактивный выбор ниши по 2 диагональным точкам (3D рамка)
 * 2. Параметрическое наполнение в свойствах слева:
 *    - Полки: равномерно или индивидуально (через запятую)
 *    - Ящики: равномерно или индивидуально (фасады + выдвижные короба)
 *    - Опциональная вертикальная перегородка
 * 3. Живой предпросмотр в 3D при любом изменении параметров
 * 4. Кнопка [ПОСТРОИТЬ В МОДЕЛЬ] для чистой фиксации в проект
 */

// 1. Запрос габаритов ниши по двум точкам
Action.Hint = 'Укажите ПЕРВУЮ точку ниши (например, левый нижний ближний угол)';
var p1 = GetPoint('Укажите первую точку угла ниши');
if (!p1) {
    Action.Finish();
}

Action.Hint = 'Укажите ВТОРУЮ противоположную точку ниши (правый верхний дальний угол)';
var p2 = GetPoint('Укажите противоположную точку угла ниши');
if (!p2) {
    Action.Finish();
}

// Вычисляем границы ниши
var xMin = Math.min(p1.x, p2.x);
var xMax = Math.max(p1.x, p2.x);
var yMin = Math.min(p1.y, p2.y);
var yMax = Math.max(p1.y, p2.y);
var zMin = Math.min(p1.z, p2.z);
var zMax = Math.max(p1.z, p2.z);

var initW = Math.round(xMax - xMin);
var initH = Math.round(yMax - yMin);
var initD = Math.round(zMax - zMin);

// Если указали в плоском 2D виде или глубина ниши близка к нулю
if (initD < 20) {
    initD = 500;
    zMin = 0;
    zMax = 500;
}

// 2. Создание панели свойств Action.Properties слева
var Prop = Action.Properties;
Prop.Clear();

// [Группа 1: Размеры ниши]
var grSize = Prop.NewGroup('1. Размеры ниши');
var pW = grSize.NewNumber('Ширина W (X), мм', initW);
var pH = grSize.NewNumber('Высота H (Y), мм', initH);
var pD = grSize.NewNumber('Глубина D (Z), мм', initD);

// [Группа 2: Тип наполнения]
var grType = Prop.NewGroup('2. Что построить');
var pType = grType.NewCombo('Наполнение', 'Полки\nВыдвижные ящики (фасад + короб)\nТолько фасады ящиков\nВертикальная перегородка + полки');
pType.ItemIndex = 0;

// [Группа 3: Настройки полок]
var grShelves = Prop.NewGroup('3. Параметры полок');
var pShelfMode = grShelves.NewCombo('Распределение полок', 'Равномерно\nИндивидуально (через запятую)');
pShelfMode.ItemIndex = 0;
var pShelfCount = grShelves.NewNumber('Количество полок (при равном.)', 3);
var pShelfCustom = grShelves.NewString('Просветы снизу (мм через запятую)', '250, 300, 300');
var pShelfType = grShelves.NewCombo('Тип полок', 'Съемные (с зазором 1 мм)\nЖесткие (в распор)');
pShelfType.ItemIndex = 0;
var pShelfIndentFront = grShelves.NewNumber('Утопить спереди, мм', 20);
var pShelfIndentBack = grShelves.NewNumber('Отступ сзади, мм', 5);

// [Группа 4: Настройки ящиков]
var grDrawers = Prop.NewGroup('4. Параметры ящиков');
var pDrawerMode = grDrawers.NewCombo('Расчет высот ящиков', 'Равномерно\nИндивидуально (через запятую)');
pDrawerMode.ItemIndex = 0;
var pDrawerCount = grDrawers.NewNumber('Количество ящиков (при равном.)', 3);
var pDrawerCustom = grDrawers.NewString('Высоты фасадов снизу (мм через запятую)', '300, 200, 200');
var pDrawerFacadeType = grDrawers.NewCombo('Тип фасадов', 'Вкладные (внутрь ниши)\nНакладные');
pDrawerFacadeType.ItemIndex = 0;
var pDrawerGapBet = grDrawers.NewNumber('Зазор между фасадами, мм', 3);
var pDrawerGapBot = grDrawers.NewNumber('Зазор снизу ниши, мм', 2);
var pDrawerGapTop = grDrawers.NewNumber('Зазор сверху ниши, мм', 2);
var pDrawerSlideGap = grDrawers.NewNumber('Зазор направляющих (на сторону), мм', 13);
var pDrawerBoxHeight = grDrawers.NewCombo('Высота короба', 'Авто (Фасад - 50 мм)\n100 мм\n120 мм\n150 мм\n180 мм');
pDrawerBoxHeight.ItemIndex = 0;
var pDrawerBoxDepth = grDrawers.NewCombo('Глубина короба', 'Авто (по стандарту направляющих)\n250 мм\n300 мм\n350 мм\n400 мм\n450 мм\n500 мм\n550 мм');
pDrawerBoxDepth.ItemIndex = 0;
var pDrawerBottomType = grDrawers.NewCombo('Дно ящика', 'ДВП 4 мм (накладное)\nЛДСП (вкладное)');
pDrawerBottomType.ItemIndex = 0;

// [Группа 5: Вертикальная перегородка]
var grDivider = Prop.NewGroup('5. Вертикальная перегородка (опция)');
var pDividerEnable = grDivider.NewBool('Добавить перегородку', false);
var pDividerPosMode = grDivider.NewCombo('Положение перегородки', 'Ровно по центру\nСмещение слева (мм)');
pDividerPosMode.ItemIndex = 0;
var pDividerOffset = grDivider.NewNumber('Смещение от левого края, мм', Math.round(initW / 2));
var pDividerShelvesLeft = grDivider.NewBool('Полки в левой секции', true);
var pDividerShelvesRight = grDivider.NewBool('Полки в правой секции', true);

// [Группа 6: Кнопки действий]
var grActions = Prop.NewGroup('6. Завершение');
var btnBuild = grActions.NewButton('ПОСТРОИТЬ В МОДЕЛЬ');
var btnCancel = grActions.NewButton('Отмена');

// Вспомогательная функция парсинга строки чисел через запятую
function parseNumberList(str, defaultVal) {
    if (!str) return [];
    var cleaned = str.replace(/;/g, ',');
    var parts = cleaned.split(',');
    var res = [];
    for (var i = 0; i < parts.length; i++) {
        var s = parts[i].replace(/^\s+|\s+$/g, '');
        if (s.length > 0) {
            var val = parseFloat(s);
            if (!isNaN(val) && val > 0) {
                res.push(val);
            }
        }
    }
    if (res.length === 0 && defaultVal) {
        res.push(defaultVal);
    }
    return res;
}

// Стандартный ряд направляющих
function getStandardSlideDepth(availDepth) {
    var std = [550, 500, 450, 400, 350, 300, 250];
    for (var i = 0; i < std.length; i++) {
        if (availDepth >= std[i]) {
            return std[i];
        }
    }
    return Math.max(150, Math.floor(availDepth / 50) * 50);
}

// Функция построения полок в заданной секции
function buildShelvesInSection(secX1, secX2, secY1, secY2, secZ1, secZ2) {
    var T = ActiveMaterial.Thickness;
    if (!T || T <= 0) T = 16;
    
    var indentFront = pShelfIndentFront.Value;
    var indentBack = pShelfIndentBack.Value;
    var sideGap = (pShelfType.ItemIndex === 0) ? 1 : 0; // 1 мм для съемной, 0 для жесткой
    
    var shelfX1 = secX1 + sideGap;
    var shelfX2 = secX2 - sideGap;
    var shelfZ1 = secZ1 + indentBack;
    var shelfZ2 = secZ2 - indentFront;
    
    var secH = secY2 - secY1;
    
    if (pShelfMode.ItemIndex === 0) {
        // Равномерное распределение
        var count = Math.max(1, Math.round(pShelfCount.Value));
        var lightH = secH - count * T;
        if (lightH < 10) return;
        var step = lightH / (count + 1);
        
        for (var k = 0; k < count; k++) {
            var posY = secY1 + (k + 1) * step + k * T;
            var shelf = AddHorizPanel(shelfX1, shelfZ1, shelfX2, shelfZ2, posY);
            if (shelf) shelf.Name = 'Полка ' + (k + 1);
        }
    } else {
        // Индивидуальные просветы снизу вверх
        var gaps = parseNumberList(pShelfCustom.Value, 300);
        var curY = secY1;
        for (var k = 0; k < gaps.length; k++) {
            curY += gaps[k];
            if (curY + T > secY2) break;
            var shelf = AddHorizPanel(shelfX1, shelfZ1, shelfX2, shelfZ2, curY);
            if (shelf) shelf.Name = 'Полка ' + (k + 1);
            curY += T;
        }
    }
}

// Функция построения ящиков в заданной секции
function buildDrawersInSection(secX1, secX2, secY1, secY2, secZ1, secZ2, onlyFacades) {
    var T = ActiveMaterial.Thickness;
    if (!T || T <= 0) T = 16;
    
    var secW = secX2 - secX1;
    var secH = secY2 - secY1;
    var secD = secZ2 - secZ1;
    
    var gapSide = (pDrawerFacadeType.ItemIndex === 0) ? 2 : -14; // вкладной / накладной
    var gapBet = pDrawerGapBet.Value;
    var gapBot = pDrawerGapBot.Value;
    var gapTop = pDrawerGapTop.Value;
    var slideGap = pDrawerSlideGap.Value;
    
    // Расчет высот фасадов
    var facadeHeights = [];
    if (pDrawerMode.ItemIndex === 0) {
        // Равномерно
        var dCount = Math.max(1, Math.round(pDrawerCount.Value));
        var totalGaps = gapBot + gapTop + gapBet * (dCount - 1);
        var availH = secH - totalGaps;
        if (availH < 30) return;
        var singleH = availH / dCount;
        for (var i = 0; i < dCount; i++) {
            facadeHeights.push(singleH);
        }
    } else {
        // Индивидуально
        facadeHeights = parseNumberList(pDrawerCustom.Value, 200);
    }
    
    // Определение глубины короба
    var boxD = 450;
    var availDepth = secD - 20; // 20 мм отступ сзади
    if (pDrawerBoxDepth.ItemIndex === 0) {
        boxD = getStandardSlideDepth(availDepth);
    } else {
        var stdMap = [0, 250, 300, 350, 400, 450, 500, 550];
        boxD = stdMap[pDrawerBoxDepth.ItemIndex];
    }
    
    var curFacadeY = secY1 + gapBot;
    for (var j = 0; j < facadeHeights.length; j++) {
        var fh = facadeHeights[j];
        if (curFacadeY + fh > secY2 + 5) break;
        
        BeginBlock('Ящик ' + (j + 1));
        
        // 1. Фасад
        var facX1 = secX1 + gapSide;
        var facX2 = secX2 - gapSide;
        var facY1 = curFacadeY;
        var facY2 = curFacadeY + fh;
        var facZ = (pDrawerFacadeType.ItemIndex === 0) ? (secZ2 - T) : secZ2;
        
        var facade = AddFrontPanel(facX1, facY1, facX2, facY2, facZ);
        if (facade) facade.Name = 'Фасад ящика ' + (j + 1);
        
        // Если строим корпус ящика
        if (!onlyFacades) {
            // Высота короба
            var boxH = fh - 50;
            if (pDrawerBoxHeight.ItemIndex === 1) boxH = 100;
            else if (pDrawerBoxHeight.ItemIndex === 2) boxH = 120;
            else if (pDrawerBoxHeight.ItemIndex === 3) boxH = 150;
            else if (pDrawerBoxHeight.ItemIndex === 4) boxH = 180;
            if (boxH < 50) boxH = 50;
            if (boxH > fh - 20) boxH = fh - 20;
            
            var boxY1 = curFacadeY + 15;
            var boxY2 = boxY1 + boxH;
            var boxZFront = (pDrawerFacadeType.ItemIndex === 0) ? (secZ2 - T) : secZ2;
            var boxZBack = boxZFront - boxD;
            
            // Боковины короба (левая и правая)
            var leftSideX = secX1 + slideGap;
            var rightSideX = secX2 - slideGap - T;
            
            var bLeft = AddVertPanel(boxZBack, boxY1, boxZFront, boxY2, leftSideX);
            if (bLeft) bLeft.Name = 'Боковина ящика Лев';
            var bRight = AddVertPanel(boxZBack, boxY1, boxZFront, boxY2, rightSideX);
            if (bRight) bRight.Name = 'Боковина ящика Прав';
            
            // Передняя и задняя стенки короба (между боковинами)
            var innerX1 = leftSideX + T;
            var innerX2 = rightSideX;
            
            var frontWall = AddFrontPanel(innerX1, boxY1, innerX2, boxY2, boxZFront - T);
            if (frontWall) frontWall.Name = 'Передняя стенка короба';
            
            var backWall = AddFrontPanel(innerX1, boxY1, innerX2, boxY2, boxZBack);
            if (backWall) backWall.Name = 'Задняя стенка короба';
            
            // Дно ящика
            if (pDrawerBottomType.ItemIndex === 0) {
                // ДВП 4 мм накладное снизу
                var dno = AddHorizPanel(leftSideX, boxZBack, rightSideX + T, boxZFront, boxY1 - 4);
                if (dno) dno.Name = 'Дно ящика (ДВП)';
            } else {
                // ЛДСП вкладное внутри короба
                var dno = AddHorizPanel(innerX1, boxZBack + T, innerX2, boxZFront - T, boxY1);
                if (dno) dno.Name = 'Дно ящика (ЛДСП)';
            }
        }
        
        EndBlock();
        curFacadeY += fh + gapBet;
    }
}

// Главная функция сборки
function BuildAll() {
    var curW = pW.Value;
    var curH = pH.Value;
    var curD = pD.Value;
    
    var curX1 = xMin;
    var curX2 = xMin + curW;
    var curY1 = yMin;
    var curY2 = yMin + curH;
    var curZ1 = zMin;
    var curZ2 = zMin + curD;
    
    var T = ActiveMaterial.Thickness;
    if (!T || T <= 0) T = 16;
    
    BeginBlock('Наполнение ниши (' + Math.round(curW) + 'x' + Math.round(curH) + 'x' + Math.round(curD) + ')');
    
    // Проверка вертикальной перегородки
    var hasDivider = pDividerEnable.Value || (pType.ItemIndex === 3);
    if (hasDivider) {
        var divX = curX1 + (curW - T) / 2;
        if (pDividerPosMode.ItemIndex === 1) {
            divX = curX1 + pDividerOffset.Value;
        }
        // Ограничиваем положение перегородки внутри ниши
        if (divX < curX1 + 50) divX = curX1 + 50;
        if (divX > curX2 - 50 - T) divX = curX2 - 50 - T;
        
        var divPanel = AddVertPanel(curZ1, curY1, curZ2, curY2, divX);
        if (divPanel) divPanel.Name = 'Перегородка вертикальная';
        
        // Левая секция
        if (pDividerShelvesLeft.Value) {
            buildShelvesInSection(curX1, divX, curY1, curY2, curZ1, curZ2);
        }
        // Правая секция
        if (pDividerShelvesRight.Value) {
            buildShelvesInSection(divX + T, curX2, curY1, curY2, curZ1, curZ2);
        }
    } else {
        // Без перегородки - одиночная секция
        if (pType.ItemIndex === 0) {
            // Полки
            buildShelvesInSection(curX1, curX2, curY1, curY2, curZ1, curZ2);
        } else if (pType.ItemIndex === 1) {
            // Ящики с корпусами
            buildDrawersInSection(curX1, curX2, curY1, curY2, curZ1, curZ2, false);
        } else if (pType.ItemIndex === 2) {
            // Только фасады ящиков
            buildDrawersInSection(curX1, curX2, curY1, curY2, curZ1, curZ2, true);
        }
    }
    
    EndBlock();
}

// Реакция на изменение любого свойства (живой предпросмотр в 3D)
Prop.OnChange = function() {
    DeleteNewObjects();
    BuildAll();
};

// Реакция кнопок
btnBuild.OnClick = function() {
    DeleteNewObjects();
    BuildAll();
    Action.Commit();
    Action.Finish();
};

btnCancel.OnClick = function() {
    DeleteNewObjects();
    Action.Cancel();
};

// Первичное построение предпросмотра сразу после клика по двум точкам
BuildAll();
Action.Hint = 'Настройте параметры в свойствах слева и нажмите [ПОСТРОИТЬ В МОДЕЛЬ]';
Action.Continue();
