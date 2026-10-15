// Тест реальных физических отверстий через Subtraction (вычитание цилиндров)
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0); // X: [0..16], Y: [0..1000], Z: [0..560]
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60); // X: [16..560], Y: [60..76], Z: [0..560]

// 1. Сквозные отверстия D=8 мм в боковине под евровинт:
// В вертикальной панели AddVertPanel(z1, y1, z2, y2, x):
// X в контуре = координата Z (0..560)
// Y в контуре = координата Y (0..1000)
var h1 = NewContour();
h1.AddCircle(100, 68, 4); // D=8 (R=4) на высоте Y=68, отступ Z=100
leftSide.Contour.Subtraction(h1);

var h2 = NewContour();
h2.AddCircle(460, 68, 4); // D=8 (R=4) на высоте Y=68, отступ Z=460
leftSide.Contour.Subtraction(h2);

leftSide.Build();

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
