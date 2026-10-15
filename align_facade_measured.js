// ==============================================================================
// Скрипт: Точный замер реальных расстояний от краев фасада до боковин/направляющих
// и автоматическое центрирование фасада ровно по середине
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

NewModel();
LoadModel(drawerPath);

var facade = null;
var leftGuide = null;
var rightGuide = null;
var leftBoxSide = null;
var rightBoxSide = null;

// Ищем ключевые детали: фасад, боковины ящика, направляющие
function analyzeObjects(parent) {
    if (!parent || !parent.Count) return;

    for (var i = 0; i < parent.Count; i++) {
        var obj = parent.Objects[i];

        if (obj.Name.indexOf('Фасад ящика') !== -1 && obj.AsPanel) {
            facade = obj;
        } else if (obj.Name.indexOf('Боковина ящика') !== -1 && obj.AsPanel) {
            if (!leftBoxSide) {
                leftBoxSide = obj;
            } else {
                if (obj.GabMin.x < leftBoxSide.GabMin.x) {
                    rightBoxSide = leftBoxSide;
                    leftBoxSide = obj;
                } else {
                    rightBoxSide = obj;
                }
            }
        }

        if (obj.Count && obj.Count > 0) {
            analyzeObjects(obj);
        }
    }
}

analyzeObjects(Model);

if (!facade || !leftBoxSide || !rightBoxSide) {
    alert('Не удалось определить детали:\n' +
          'Фасад: ' + (facade ? 'найден' : 'нет') + '\n' +
          'Боковина левая: ' + (leftBoxSide ? 'найдена' : 'нет') + '\n' +
          'Боковина правая: ' + (rightBoxSide ? 'найдена' : 'нет'));
} else {
    // Реальные координаты X
    var facadeLeftX  = facade.GabMin.x;
    var facadeRightX = facade.GabMax.x;
    var facadeWidth  = facade.GabMax.x - facade.GabMin.x;

    var boxLeftX  = leftBoxSide.GabMin.x;
    var boxRightX = rightBoxSide.GabMax.x;

    // Свесы фасада относительно корпуса ящика
    var overhangLeft  = boxLeftX - facadeLeftX;
    var overhangRight = facadeRightX - boxRightX;

    // Центр корпуса ящика и центр фасада
    var boxCenterX = (boxLeftX + boxRightX) / 2;
    var facadeCenterX = (facadeLeftX + facadeRightX) / 2;

    // Точное смещение, чтобы центры совпали абсолютно симметрично
    var shift = boxCenterX - facadeCenterX;

    var msg = 'Текущие замеры:\n' +
              'Фасад (X): от ' + facadeLeftX.toFixed(3) + ' до ' + facadeRightX.toFixed(3) + ' (Ширина: ' + facadeWidth.toFixed(3) + ')\n' +
              'Корпус ящика (X): от ' + boxLeftX.toFixed(3) + ' до ' + boxRightX.toFixed(3) + '\n\n' +
              'Свес фасада слева: ' + overhangLeft.toFixed(3) + ' мм\n' +
              'Свес фасада справа: ' + overhangRight.toFixed(3) + ' мм\n' +
              'Разница свесов: ' + (overhangLeft - overhangRight).toFixed(3) + ' мм\n\n' +
              'Требуемый сдвиг для идеальной симметрии: ' + shift.toFixed(3) + ' мм\n\n' +
              'Выполнить центрирование и сохранить?';

    if (confirm(msg)) {
        facade.PositionX += shift;
        facade.Build();
        Action.Commit();
        SaveModel(drawerPath);

        alert('Готово!\nФасад смещен на ' + shift.toFixed(3) + ' мм.\n' +
              'Новые свесы: слева = ' + (overhangLeft - shift).toFixed(3) + ' мм, справа = ' + (overhangRight + shift).toFixed(3) + ' мм.\n' +
              'Файл ящика сохранен с абсолютно равными расстояниями!');
    }
}
