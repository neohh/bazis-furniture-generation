var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

NewModel();

var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);

var drawerBlock = null;
for (var i = 0; i < wrapper.Count; i++) {
    if (wrapper.Objects[i].Name === 'ящик НОВЫЙ') {
        drawerBlock = wrapper.Objects[i];
        break;
    }
}
if (!drawerBlock && wrapper.Count > 0) drawerBlock = wrapper.Objects[0];

var log = [];

function inspectElasticity(obj, name) {
    log.push('=== ' + name + ' ===');
    if (obj.Elasticity) {
        log.push('Elasticity: ' + typeof obj.Elasticity);
        for (var k in obj.Elasticity) {
            log.push('  ' + k + ' = ' + obj.Elasticity[k]);
        }
    } else {
        log.push('Elasticity: undefined/null');
    }
    // Проверим наличие методов ресайза
    var testMethods = ['ElasticResize', 'Resize', 'SetGSize', 'MakeElastic', 'Rebuild'];
    for (var m = 0; m < testMethods.length; m++) {
        var mName = testMethods[m];
        if (typeof obj[mName] !== 'undefined') {
            log.push('  method ' + mName + ': ' + typeof obj[mName]);
        }
    }
}

inspectElasticity(drawerBlock, 'drawerBlock');
alert(log.join('\n'));
