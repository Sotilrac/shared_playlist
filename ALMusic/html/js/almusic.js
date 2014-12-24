global_vol = 0

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
                $('#logo').html("<img src=data:image/png;base64," + buffer + "></img>");
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
                var generate_active = function() {
                    $('#active_song').fadeOut().empty();
                    for (song in queue['active']) {
                        var id = queue['active'][song]['id'];
                        var title = queue['active'][song]['title'];
                        var artist = queue['active'][song]['artist'];
                        var album = queue['active'][song]['album'];
                        var cover = queue['active'][song]['cover'];
                        
                        $('#active_song').append(
                            '<img class="asong_cover" src="' + cover + '" alt="' + title + '"/>'+
                                '<div class="asong_info" id="song_data">' +
                                '<ul>' +
                                '<li class="asong_title"><span class="asong_title_label ellipsis">' + title + '</span></li>'+
                                '<li class="asong_artist"><span class="asong_artist_label ellipsis">' + artist + '</span></li>'+
                                '<li class="asong_album"><span class="asong_album_label ellipsis">' + album + '</span></li>'+
                                '</ul></div>').fadeIn();
                    }
                }
                var generate_queue = function() {
                    $('#dynamic_c').empty();
                    for (song in queue['queue']) {
                        var id = queue['queue'][song]['id'];
                        var title = queue['queue'][song]['title'];
                        var artist = queue['queue'][song]['artist'];

                        $('#dynamic_c').append(
                            '<div id="' + id + '" class="queue_card card card_shadow">' +
                                '<div class="queue_card_info">' +
                                '<div class="qc_info_field">' +
                                '<span class="title_label">' + title + '</span></div>' +
                                '<div class="qc_info_field">' + 
                                '<span class="artist_label">' + artist + '</span></div></div>' +
                                '<div class="queue_card_controls">' +
                                '<div class="qc_controls_reorder">' +
                                '<div><a id="' + id + '-Move_Up" class="btn" href="#">' +
                                '<i class="fa fa-sort-asc fa-fw"></i></a></div>' +
                                '<div><a id="' + id + '-Move_Down" class="btn" href="#">' +
                                '<i class="fa fa-sort-desc fa-fw"></i></a></div></div>' +
                                '<div id="' + id + '-controls-remove" class="qc_controls_remove">' +
                                '<a id="' + id + '-Remove" class="btn" href="#"><i class="fa fa-remove fa-fw"></i>');
                        $('#' + id + '-Remove').click(function() {
                            queue_control('Remove', id);
                        });                       
                    }
                }
                generate_active();
                generate_queue();
            })
    });
}


/////////////////////////////
//     Search Handler     //
/////////////////////////////


function generateSearchResult(data) {
    $.getService('ALMusic', function(ALMusic) {
        ALMusic.search(data, 5).done(
            function(result){
                if(result.length < 1) {
                    $('#result_c').append(
                        '<div id="no-results" class="queue_card result card_shadow">' +
                            '<div class="queue_card_empty">' +
                            'No results' +
                            '</div></div>');
                }
                else {
                    $('#result_c').empty();
                    for (song in result) {
                        var generate_result = function() {
                            var id = result[song]['id'];
                            var title = result[song]['title'];
                            var artist = result[song]['artist'];
                            var album = result[song]['album'];

                            $('#result_c').append(
                                '<div id="' + id + '" class="queue_card result card_shadow">' +
                                    '<div class="queue_card_info">' +
                                    '<div class="qc_info_field">' +
                                    '<span class="title_label">' + title + '</span></div>' +
                                    '<div class="qc_info_field">' + 
                                    '<span class="artist_label">' + artist + '</span></div></div>' +
                                    '<div class="queue_card_controls">' +                            
                                    '<div id="' + id + '-controls-add" class="sc_controls_add">' +
                                    '<a id="' + id + '-Add" class="btn" href="#"><i class="fa fa-plus fa-fw"></i>');

                            $('#' + id + '-Add').click(function() {
                                spinID(id, true);
                                $.getService('ALMusic', function(ALMusic) {                                
                                    ALMusic.enqueueId(id).done(                                    
                                        function(response) {
                                            spinID(id, false);
                                            if(Object.keys(response).length === 0){
                                                errorizeID(id);
                                                pulsateID(id);
                                            }
                                            else {
                                                $('#result_c').empty();
                                                $('#queue_add').val('');
                                            }
                                        })
                                });
                            });
                        }
                        generate_result();
                    }
                }
            })
    });
}




$("#am_search").click(function() {       
    query = $('#queue_add').val();
    if (query.length > 0){        
        generateSearchResult(query);
        // $('#queue_add').val('');
    }
    else {
        $('#result_c').empty();
    }
});

$("#queue_add").bind("enterKey",function() {       
    query = $('#queue_add').val();
    if (query.length > 0){
        generateSearchResult(query);
        // $('#queue_add').val('');
    }
    else {
        $('#result_c').empty();
    }
});

$("#queue_add").keyup(function(e){
    if(e.keyCode == 13){
        $(this).trigger("enterKey");
    }
});

////////////////////
// Queue Handlers //
////////////////////

function queue_control(action, data) {
    $.getService('ALMusic', function(ALMusic) {
        switch(action) {
        case "Enqueue":
            spin(true)
            ALMusic.enqueue(data).done(function(song){
                console.log(song);
                spin(false);
                if(Object.keys(song).length === 0){
                    pulsate();                    
                }
            });
            break;
        case "Remove":
            ALMusic.remove(data).done(function(response) {
                console.log("remove song from queue")
            });
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
        $('#result_c').empty();
    }
});

function spin(enable){
    if(enable){
        $('#add_icon').addClass('fa-spin');
    }
    else{
        $('#add_icon').removeClass('fa-spin');
    }
}

function spinID(id, enable){
    if(enable){
        $('#' + id  + '-Add').children(0).addClass('fa-spin');
    }
    else{
        $('#' + id + '-Add').children(0).removeClass('fa-spin');
    }
}

function pulsate(){
    $('#add_icon').effect('pulsate', {times:3}, 800);
}

function pulsateID(id){
    $('#' + id  + '-Add').children(0).effect('pulsate', {times:3}, 800);
}

function errorizeID(enable){
    if(enable){
        $('#' + id + '-Add').children(0).removeClass('fa-plus');
        $('#' + id  + '-Add').children(0).addClass('fa-exclamation-triangle');
    }
    else{
        $('#' + id + '-Add').children(0).removeClass('fa-exclamation-triangle');
        $('#' + id  + '-Add').children(0).addClass('fa-plus');
    }
}


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
                ALAudioDevice.isAudioOutMuted().done(
                    function(muted){
                        if (muted) {
                            $('#am_vol_mute').css('color', '#000000');
                            ALAudioDevice.muteAudioOut(false);
                            volume = global_vol
                            ALAudioDevice.setOutputVolume(volume);
                        }
                        else {
                            switch(action) {
                            case "Up":
                                volume = volume + 5;
                                if (volume > 100) {
                                    volume = 100;
                                }
                                ALAudioDevice.setOutputVolume(volume);
                                break;
                            case "Down":
                                volume = volume - 5;
                                if (volume < 0) {
                                    volume = 0;
                                }
                                ALAudioDevice.setOutputVolume(volume);
                                break;
                            case "Mute":
                                global_vol = volume;
                                $('#am_vol_mute').css('color', colors[robot_color]);
                                ALAudioDevice.muteAudioOut(true);
                            }
                        }
                    })
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
