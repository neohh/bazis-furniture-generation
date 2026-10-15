var f = NewFurnitureValue();
var ok = f.Choose();
if (ok) {
    var encoded = f.EncodeToString();
    alert('СКОПИРУЙТЕ ЭТУ СТРОКУ:\n\n' + encoded);
    system.log('ENCODED_FURNITURE=' + encoded);
}
