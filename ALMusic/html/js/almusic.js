//Change Qimessaging connection if robot name is passed in URL
if (robotAddress != '') {
    $.qim = new QiSession(robotAddress);
}

function get_robot_name() {
    $.getService('ALSystem', function(ALSystem) {
        ALSystem.robotName().done(
            function (name){
                get_robot_color(name);
                $('#robot_name').html("DJ " + name ).css({'color': colors[robot_color]});
            })
    });
}

function get_robot_icon() {
    $.getService('ALSystem', function(ALSystem) {
        ALSystem.robotIcon().done(
            function (buffer){
                $('#logo').html("<img src=data:unknown;base64," + buffer + "></img>");
            })
    });
}

function get_robot_color(name) {
    name = name.toLowerCase();
    switch (name) {
    case "raphael":
        robot_color = "red";
        break;
    case "michelangelo":
        robot_color = "orange";
        break;
    case "donatello":
        robot_color = "dpurp";
        break;
    case "leonardo":
        robot_color = "blue";
        break;
    default:
        var sum = $.map(name.split(""), function(c) {return c.charCodeAt()}).reduce(function(a, b) {return a + b})
        color_idx = sum % Object.keys(colors).length
        robot_color = Object.keys(colors)[color_idx]           
    }
    $('body').css('background-color', colors[robot_color]);
    $('<style>a:active{color:' + colors[robot_color] + '}</style>').appendTo("head");
}

function get_language() {
    $.getService('ALSpeechRecognition', function(ALSpeechRecognition) {
        ALSpeechRecognition.getLanguage().done(function (lang){
            var clang = $('#language_value').text();
            if (lang != clang) {
                $('#language_value').html(lang);
                switch(lang) {
                case "English":
                    switch_to_english();
                    break;
                case "Spanish":
                    switch_to_spanish();
                    break;
                case "French":
                    switch_to_french();
                    break;
                default:
                    console.log("Language currently unsupported; default to english");
                    switch_to_english();
                }
            }
        })
    });
}

function switch_to_english() {
    //
}

function switch_to_french() {
    //
}

function switch_to_spanish() {
    //
}

function generateQueue() {
    // Do stuff with queue
    $.getService('ALMusic', function(ALMusic) {
        ALMusic.getQueue().done(
            function(queue) {

                var id;
                var title;
                var artist;
                var album;
                var cover;

                $('#active_song').fadeOut().empty();
                for (song in queue['active']) {
                    id = queue['active'][song]['id'];
                    title = queue['active'][song]['title'];
                    artist = queue['active'][song]['artist'];
                    album = queue['active'][song]['album'];
                    cover = queue['active'][song]['cover'];
                    
                    $('#active_song').append(
                        '<img class="asong_cover" src="' + cover + '" alt="' + title + '"/>'+
                            '<div class="asong_info" id="song_data">' +
                            '<ul>' +
                            '<li class="asong_title"><span class="label">Title: </span>' + title + '</li>'+
                            '<li class="asong_artist"><span class="label">Artist: </span>' + artist + '</li>'+
                            '<li class="asong_album"><span class="label">Album: </span>' + album + '</li>'+
                            '</ul>').fadeIn();
                }
                $('#dynamic_c').empty();
                for (song in queue['queue']) {
                    id = queue['queue'][song]['id'];
                    title = queue['queue'][song]['title'];
                    artist = queue['queue'][song]['artist'];

                    $('#dynamic_c').append(
                        '<div id="' + id + '" class="queue_card card card_shadow">' +
                            '<div class="queue_card_info">' +
                            '<div class="qc_info_field">' +
                            '<span class="label">Title: </span>' + title + '</div>' +
                            '<div class="qc_info_field">' + 
                            '<span class="label">Artist: </span>' + artist + '</div></div>' +
                            '<div class="queue_card_controls">' +
                            '<div class="qc_controls_reorder">' +
                            '<div><a id="' + id + '-Move_Up" class="btn" href="#">' +
                            '<i class="fa fa-sort-asc"></i></a></div>' +
                            '<div><a id="' + id + '-Move_Down" class="btn" href="#">' +
                            '<i class="fa fa-sort-desc"></i></a></div></div>' +
                            '<div id="' + id + '-controls-remove" class="qc_controls_remove">' +
                            '<a id="' + id + '-Remove" class="btn" href="#"><i class="fa fa-remove"></i>');
                }
            })
    });
}



////////////////////
// Queue Handlers //
////////////////////

function queue_control(action, data) {
    $.getService('ALMusic', function(ALMusic) {
        switch(action) {
        case "Enqueue":
            wait_add(true)
            ALMusic.enqueue(data).done(function(song){
                console.log(song);
                wait_add(false);
                if(song){
                    fail_add();
                }
            });
            break;
        case "Remove":
            console.log("Remove functionality not implemented.");
            break;
        case "Clear":
            ALMusic.clearQueue();
            break;
        case "Move_Up":
            console.log("Move Up functionality not implemented.");
            break;
        case "Move_Down":
            console.log("Move Down functionality not implemented.");
            break;
        }
    });
}

$("#am_enqueue").click(function() {       
    query = $('#queue_add').val();
    if (query.length > 0){
        queue_control("Enqueue", query);
        $('#queue_add').val('');
    }
});

$("#queue_add").bind("enterKey",function() {       
    query = $('#queue_add').val();
    if (query.length > 0){
        queue_control("Enqueue", query);
        $('#queue_add').val('');
    }
});

function wait_add(enable){
    if(enable){
        $('#add_icon').addClass('fa-spin');
    }
    else{
        $('#add_icon').removeClass('fa-spin');
    }
}

function fail_add(){
    $('#add_icon').effect('pulsate', {times:3}, 800);
}

$("#queue_add").keyup(function(e){
    if(e.keyCode == 13)
    {
        $(this).trigger("enterKey");
    }
});

$("#am_clear").click(function() {       
    queue_control("Clear", null);
});

/////////////////////////////
// Control Button Handlers //
/////////////////////////////

function volume_control(action) {
    $.getService('ALAudioDevice', function(ALAudioDevice) {
        ALAudioDevice.getOutputVolume().done(
            function (volume) {
                switch(action) {
                case "Up":
                    volume = volume + 5;
                    if (volume > 100){
                        volume = 100;
                    }
                    ALAudioDevice.setOutputVolume(volume);
                    break;
                case "Down":
                    volume = volume - 5;
                    if (volume < 0){
                        volume = 0;
                    }
                    ALAudioDevice.setOutputVolume(volume);
                    break;
                case "Mute":
                    ALAudioDevice.isAudioOutMuted().done(
                        function(muted){
                            if (muted) {
                                ALAudioDevice.muteAudioOut(false);
                            }
                            else {
                                ALAudioDevice.muteAudioOut(true);
                            }
                        })
                }
            })
    });
}

$("#am_vol_mute").click(function() {
    volume_control("Mute");
});

$("#am_vol_down").click(function() {
    volume_control("Down");
});

$("#am_vol_up").click(function() {
    volume_control("Up");
}); 

function playback_control(action) {
    $.getService('ALMusic', function(ALMusic) {
        switch(action) {
        case "Play":
            ALMusic.play();
            break;
        case "Pause":
            console.log("Pause functionality not implemented.");
            break;
        case "Stop":
            ALMusic.stop();
            break;
        case "Next":
            ALMusic.next();
            break;
        }
    });
}

$("#am_play").click(function() {
    playback_control("Play");
});

$("#am_pause").click(function() {
    playback_control("Pause");
});

$("#am_stop").click(function() {
    playback_control("Stop");
});

$("#am_next").click(function() {
    playback_control("Next");
});

//////////////////////////


// ALMemory Subscriptions
$.subscribeToALMemoryEvent('ALMusic/onQueueChange', function(eventValue) {
    generateQueue();
});

// Connect/Disconnect signals
$.qim.socket().on('connect', init() );

function init() {
    $.when(get_robot_name()).done(function(){
        get_language();
    });
    get_robot_icon();
    generateQueue();
    $('body').fadeIn();
}

$.qim.socket().on('disconnect', function() {
    $('body').css('background-color','gray');
});
