export default function () {
    let isIE = false;
    let rv;
    let ua = navigator.userAgent;
    if (new RegExp('Trident/.*rv:([0-9]{1,}[\.0-9]{0,})').exec(ua) != null) {
        rv = parseFloat(RegExp.$1);
    } else {
        rv = -1;
    }

    if (rv !== -1) {
        isIE = true;
    }

    return isIE;
}