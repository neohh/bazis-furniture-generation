// Диагностика почему конфирмат создался как Rafix
var PRESETS_FILE = 'Z:\\Work\\генерация мебели\\fastener_presets.json';
var rawText = system.readTextFile(PRESETS_FILE);
var config = JSON.parse(rawText);

NewModel();

var pSide = AddVertPanel(0, 0, 560, 1000, 0);
var pBottom = AddHorizPanel(16, 0, 560, 560, 60);

var fConf = OpenFurniture(config.hardware.confirmat.path);
alert('confirmat obj name: ' + (fConf ? fConf.Name : 'null') + '\npath: ' + config.hardware.confirmat.path);

var fVB = OpenFurniture(config.hardware.vb.path);
alert('vb obj name: ' + (fVB ? fVB.Name : 'null') + '\npath: ' + config.hardware.vb.path);
