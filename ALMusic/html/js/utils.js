// Avoid 'console' errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Get URL parameters by name
// Usage: http://page.url?parameter_name=something&another_parameter=anotherthing
function get_url_parameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function shuffle(list) {
    var i, j, t;
    for (i = 1; i < list.length; i++) {
        j = Math.floor(Math.random()*(1+i));  // choose j in [0..i]
        if (j != i) {
            t = list[i];                        // swap list[i] and list[j]
            list[i] = list[j];
            list[j] = t;
        }
    }
}

function display_image(id, path) {
    $(id).css('background-image', 'url(' + path + ')').fadeIn('slow');
}

 var colors = {}
     colors["blue"] = "#109EDC";
     colors["orange"] = "#E59230";
     colors["green"] = "#5ABF41";
     colors["teal"] = "#43C0C0";
     colors["red"] = "#EF2929";
     colors["purple"] = "#8265B2";
     colors["dpurp"] = "#5F3BD7";
     colors["efuchsia"] = "#C138A1";

var robot_color = null

var robotName = get_url_parameter('robot');
var robotAddress = (robotName == '') ? '' : 'http://' + robotName + '.local';


// Load appropriate qimessaging depending on running from robot or with a robot
// name specified in the URL
document.write("<script type='text/javascript' src=" +
                robotAddress +
                "/libs/qimessaging/1.0/qimessaging.js><\/script>");