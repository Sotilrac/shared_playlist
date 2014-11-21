// Avoid `console` errors in browsers that lack a console.
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

function hide_image(id) {
    $(id).css('background-image', 'none');
    $(id).parent().css('padding', '0 0').css('max-width', '100%').css('max-height', '100%');
}

function display_portrait(id, path) {
    $(id).parent().css('padding', '5% 10%').css('max-width', '80%').css('max-height', '90%');
    display_image(id, path);
}

function display_choices (choices_str) {
    var id = '#choices';
    $(id).empty();
    try {
        choices = jQuery.parseJSON(choices_str);
        for (c in choices) {
            $(id).append($('<li style="background-image:url('+ choices[c].image + ');">'+ choices[c].name +'</li>'));
        }
        $(id).parent().fadeIn('slow');
    }
    catch(err) {
        console.log(err);
    } 
}
