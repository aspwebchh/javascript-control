function addEventHandler(target, type, func) {
    if (target.addEventListener)
        target.addEventListener(type, func, false);
    else if (target.attachEvent)
        target.attachEvent("on" + type, func);
    else target["on" + type] = func;
}

function removeEventHandler(target, type, func) {
    if (target.removeEventListener)
        target.removeEventListener(type, func, false);
    else if (target.detachEvent)
        target.detachEvent("on" + type, func);
    else delete target["on" + type];
}

function getOffset( element ) {
    var left = element.offsetLeft;
    var top = element.offsetTop;
    element = element.offsetParent;
    while (element) {
        left += element.offsetLeft;
        top += element.offsetTop;
        element = element.offsetParent;
    }
  
    return { left: left, 
        top: top }
}

function checkDate(datestr) {
    var regex = /^(\d{1,4})(-|\/|.)(\d{1,2})\2(\d{1,2})$/;       
    if(!regex.test(datestr) || !isDate(datestr)) return false
        else return true;
    
    function isDate(s){
        var s    = s.replace(/\-|\/|\./g,"/");
        var p    = s.split("/");
        var y    = parseInt(p[0]);
        var m    = parseInt(p[1]) - 1;
        var d    = parseInt(p[2]);
        var a    = new Date(y,m,d);
        if(a.getFullYear()!=y || a.getMonth()!=m || a.getDate() != d) return false;
        else return true;
    }
}    