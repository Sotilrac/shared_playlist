var Music;
global_vol = 0
var dataset = 'global';
var favorite_to_icon = ['fa-heart-o', 'fa-heart-o color-heart', 'fa-heart color-heart'];


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
    $("#am_search").css( "color", colors[robot_color] );
    $("#am_search").parent().css( "box-shadow", "inset 0px -4px 0px 0px" + colors[robot_color] );
    $('<style>color-heart{color:' + colors[robot_color] + '}</style>').appendTo("head");
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
    Music.getQueue().done(function(queue) {
        $('#active_song').empty();
        if (Object.keys(queue['active']).length == 0) {
            $('#active_song').fadeOut();
        } else {
            for (song in queue['active']) {
                var generate_active = function() {
                    var id = queue['active'][song]['id'];
                    var flevel = queue['active'][song]['f_level'];
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
                            '</ul>' +
                            '</div>' +
                            '<div class="asong_controls">' +                            
                            '<div id="am_play_stop" class="asong_controls_double">' +
                            '<i id="am_play_stop_icon" class="btn fa fa-play fa-fw"></i>' +
                            '</div>' +
                            '<div id="new_am_next" class="asong_controls_double">' +
                            '<i class="btn fa fa-fast-forward fa-fw"></i>' +
                            '</div>' +
                            '<div id="favorite-' + id + '" class="asong_controls_single">' +
                            '<i id="favorite-' + id + '-icon" class="btn fa ' + favorite_to_icon[ parseInt(flevel) ] +
                            ' fa-fw"></i>' + 
                            '</div>' +
                            '</div>').fadeIn();

                    $('#favorite-' + id).click(function() {
                        favorite_control(id);
                    });                       
                }
                generate_active();
            }
        }
        $('#dynamic_c').empty();
        for (song in queue['queue']) {
            var generate_queue = function() {
                var id = queue['queue'][song]['id'];
                var title = queue['queue'][song]['title'];
                var artist = queue['queue'][song]['artist'];

                $('#dynamic_c').append(
                    '<div id="' + id + '" class="queue_card card card_shadow">' +
                        '<div class="queue_card_info">' +
                        '<div class="qc_info_field">' +
                        '<span class="title_label">' + title + '</span>' +
                        '</div>' +
                        '<div class="qc_info_field">' + 
                        '<span class="artist_label">' + artist + '</span>' +
                        '</div>' + 
                        '</div>' +                      
                        '<div class="queue_card_controls">' +                            
                        '<div id="' + id + '-controls-remove" class="c_controls_solo">' +
                        '<i id="' + id + '-Remove" class="btn fa fa-remove fa-fw"></i>' +
                        '</div>' +
                        '</div>');

                $('#' + id + '-Remove').click(function() {
                    queue_control('Remove', id);
                });                       
            }
            generate_queue();
        }
    })
}


/////////////////////////////
//     Search Handler     //
/////////////////////////////


function generateSearchResult(data) {
    Music.search(data, 5).done(function(result){
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
                        '<div id="' + id + '-controls-add" class="c_controls_solo">' +
                        '<i id="' + id + '-Add" class="btn fa fa-plus fa-fw"></i></div></div>');

                    $('#' + id + '-Add').click(function() {
                        spinID(id, true);
                        Music.enqueueId(id).done(function(response) {
                            spinID(id, false);
                            if(Object.keys(response).length === 0){
                                errorizeID(id, true);
                                pulsateID(id);
                            }
                            else {
                                $('#result_c').empty();
                                $('#queue_add').val('');
                            }
                        })
                    });
                }
                generate_result();
            }
        }
    })
}

// $("#queue_add").change(function() {       
//     query = $('#queue_add').val();
//     if (query.length > 0){        
//         generateSearchResult(query);
//         // $('#queue_add').val('');
//     }
//     else {
//         $('#result_c').empty();
//     }
// });

// $("#queue_add").blur(function() {       
//     query = $(this).val('');
//     query_handler();
// });

$("#queue_add").click(function() {       
    query_handler();
});

$("#am_search").click(function() { 
    switch_search_dataset("#am_search");
    query_handler();
});

$("#queue_add").bind("enterKey",function() {   
    query_handler();    
});

$("#am_favorites").click(function() {       
    switch_search_dataset("#am_favorites");
    query_handler();
});


var timer;
$("#queue_add").keyup(function(e){
    if(e.keyCode == 13){
        $(this).trigger("enterKey");
    }
    else {
        clearTimeout(timer)
        timer = setTimeout(function(){ query_handler(); }, 200);
    }
});

function query_handler() {
    query = $('#queue_add').val();
    if (query.length > 0){        
        generateSearchResult(query);
    }
    else {
        $('#result_c').empty();
    }
}

function switch_search_dataset(clicked) {
    switch (clicked) {
    case "#am_search":
        dataset = 'global';
        $("#am_favorites").css( "color", "#000" );
        $("#am_favorites").parent().css( "box-shadow", "inset 0px 0px 0px 0px #000" );
        $("#am_search").css( "color", colors[robot_color] );
        $("#am_search").parent().css( "box-shadow", "inset 0px -4px 0px 0px" + colors[robot_color] );
        break;
    case "#am_favorites":
        dataset = 'favorites';
        $("#am_search").css( "color", "#000" );
        $("#am_search").parent().css( "box-shadow", "inset 0px 0px 0px 0px #000" );
        $("#am_favorites").css( "color", colors[robot_color] );
        $("#am_favorites").parent().css( "box-shadow", "inset 0px -4px 0px 0px" + colors[robot_color] );
        break;
    default:
        break;
    }    
}

///////////////////////
// Favorite Handlers //
///////////////////////

function favorite_control(id) {


}

////////////////////
// Queue Handlers //
////////////////////

function queue_control(action, data) {
    switch(action) {
    case "Enqueue":
        spin(true)
        Music.enqueue(data).done(function(song){
            console.log(song);
            spin(false);
            if(Object.keys(song).length === 0){
                pulsate();                    
            }
        });
        break;
    case "Remove":
        Music.remove(data).done(function(response) {
            console.log("remove song from queue")
        });
        break;
    case "Clear":
        Music.clearQueue();
        break;
    case "Move_Up":
        console.log("Move Up functionality not implemented.");
        break;
    case "Move_Down":
        console.log("Move Down functionality not implemented.");
        break;
    }
}

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
        $('#' + id  + '-Add').addClass('fa-spin');
    }
    else{
        $('#' + id + '-Add').removeClass('fa-spin');
    }
}

function pulsate(){
    $('#add_icon').effect('pulsate', {times:3}, 800);
}

function pulsateID(id){
    $('#' + id  + '-Add').effect('pulsate', {times:3}, 800);
}

function errorizeID(id, enable){
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
    switch(action) {
    case "Play":
        Music.play();
        break;
    case "Pause":
        console.log("Pause functionality not implemented.");
        break;
    case "Stop":
        Music.stop();
        break;
    case "Next":
        Music.next();
        break;
    }
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

$( window ).resize(function() {
    center_and_size_dj();
});

function center_and_size_dj() {
    $('#dj').textfill({ 
        explicitHeight: $('#dj').height(),
        explicitWidth: $('#dj').width()    
    });
}

//////////////////////////


// ALMemory Subscriptions
$.subscribeToALMemoryEvent('Music/onQueueChange', function(eventValue) {
    generateQueue();
});

// Connect/Disconnect signals
$.qim.socket().on('connect', init() );

function init() {
    $.qim.service("Music").done(function (service) {
        Music = service;
        $.when(get_robot_name()).done(function(){
            get_language();
        });
        get_robot_icon();
        generateQueue();
        $('body').fadeIn();
    }).fail(function (error) {
        console.log("An error occurred:", error);
    });
}

$.qim.socket().on('disconnect', function() {
    $('body').css('background-color','gray');
});