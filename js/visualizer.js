window.onload = function() {
    var audio = document.getElementById("audio");
    var low = document.getElementById("low-color-picker");
    var high = document.getElementById("high-color-picker");
    var undertone = document.getElementById("undertone-color-picker");
    var background = document.getElementById("background-color-picker");
    var low_wrapper = document.getElementById("low-color-input-wrapper");
    var high_wrapper = document.getElementById("high-color-input-wrapper");
    var undertone_wrapper = document.getElementById("undertone-color-input-wrapper");
    var background_wrapper = document.getElementById("background-color-input-wrapper");
    var low_color, high_color, undertone_color, background_color;
    var loadFromProfileID = null;
    var editingProfile = false;
    var pauseRendering = false;
    var lightGradient = true;

    loadProfiles();
    
    audio.onplay = function() {
        $('#music-play').removeClass('glyphicon-play').addClass('glyphicon-pause');

        var context = new AudioContext();
        var src = context.createMediaElementSource(audio);
        var analyser = context.createAnalyser();
        var barHeight, barWidth, grad;
        var resolution = Math.pow(2, $('#visualizer-resolution').val());
        var space_between = $('#visualizer-spacing').val();
        var binCount = resolution/2; 

        var canvas = document.getElementById("canvas");
        canvas.width = Math.pow(2, Math.ceil(Math.log2(document.getElementById("visualizer").clientWidth)));
        canvas.height = document.getElementById("visualizer").clientHeight;
        var ctx = canvas.getContext("2d");

        src.connect(analyser);
        analyser.connect(context.destination);

        analyser.fftSize = resolution;
        var dataArray = new Uint8Array(binCount);

        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;

        function renderFrame() {
            var colors = getColors();

            if (!pauseRendering)
                requestAnimationFrame(renderFrame);

            resolution = Math.pow(2, $('#visualizer-resolution').val());
            space_between = $('#visualizer-spacing').val();

            analyser.fftSize = resolution;
            binCount = resolution/2;
            dataArray = new Uint8Array(binCount);
            analyser.getByteFrequencyData(dataArray);

            barWidth = Math.ceil(WIDTH/binCount);

            grad = ctx.createLinearGradient(0, HEIGHT, WIDTH, 0);
            if (lightGradient) {
                grad.addColorStop(0.4, colors[3]);
                grad.addColorStop(1, "white");
            } else {
                grad.addColorStop(0, "black");
                grad.addColorStop(0.6, colors[3]);
            }

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            let low_r = parseInt(colors[0].substr(1, 2), 16);
            let low_g = parseInt(colors[0].substr(3, 2), 16);
            let low_b = parseInt(colors[0].substr(5, 2), 16);
            let high_r = parseInt(colors[1].substr(1, 2), 16);
            let high_g = parseInt(colors[1].substr(3, 2), 16);
            let high_b = parseInt(colors[1].substr(5, 2), 16);
            let undertone_r = parseInt(colors[2].substr(1, 2), 16);
            let undertone_g = parseInt(colors[2].substr(3, 2), 16);
            let undertone_b = parseInt(colors[2].substr(5, 2), 16);

            for (var i = 0; i <= binCount; i++) {
                barHeight = Math.floor(HEIGHT * (dataArray[i] / 255));

                let r = low_r*((binCount-i)/binCount) + high_r*(i/binCount);
                let g = low_g*((binCount-i)/binCount) + high_g*(i/binCount);
                let b = low_b*((binCount-i)/binCount) + high_b*(i/binCount);
                let ratio = (1.5/255) * dataArray[i] + i/(2*binCount);
                r *= ratio; g *= ratio; b *= ratio;
                ratio = 1 - ratio;
                r += ratio * undertone_r;
                g += ratio * undertone_g;
                b += ratio * undertone_b;

                ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                ctx.fillRect(i*barWidth + i*space_between, HEIGHT - barHeight, barWidth, barHeight);
            }
        }

        audio.play();
        renderFrame();

        audio.onpause = function() {
            $('#music-play').removeClass('glyphicon-pause').addClass('glyphicon-play');

            setTimeout(function() {
                if (audio.paused)
                    pauseRendering = true;
            }, 1000);
        };
        audio.onplay = function() {
            $('#music-play').removeClass('glyphicon-play').addClass('glyphicon-pause');

            pauseRendering = false;
            renderFrame();
        };
    };

    function getColors(cha) {
        if (loadFromProfileID != null && cha != 'i') {
            let data = JSON.parse(JSON.parse(localStorage.getItem(loadFromProfileID)));
        
            low_color = data.low;
            high_color = data.high;
            undertone_color = data.undertone;
            background_color = data.background;
            
            return [ low_color, high_color, undertone_color, background_color ];
        } else {
            low_color = document.getElementById("low-color-picker").value;
            high_color = document.getElementById("high-color-picker").value;
            undertone_color = document.getElementById("undertone-color-picker").value;
            background_color = document.getElementById("background-color-picker").value;

            return [ low_color, high_color, undertone_color, background_color ];
        }
    }

    $(document).on('click', '.color-profile', function() {
        if (!editingProfile) {
            loadFromProfileID = this.id;

            $('#color-profile-edit-button').removeClass('btn-light');
            $('#color-profile-edit-button').addClass('btn-primary');
            $('#color-profile-delete-button').removeClass('btn-light');
            $('#color-profile-delete-button').addClass('btn-primary');

            document.getElementById(this.id).classList.toggle('profile-selected');

            if ($('.profile-selected').length == 0) {
                loadFromProfileID = null;

                $('#color-profile-edit-button').removeClass('btn-primary');
                $('#color-profile-edit-button').addClass('btn-light');
                $('#color-profile-delete-button').removeClass('btn-primary');
                $('#color-profile-delete-button').addClass('btn-light');
            }
            if ($('.profile-selected').length > 1) {
                $('.profile-selected').toggleClass('profile-selected');
                document.getElementById(this.id).classList.toggle('profile-selected');
            } 
        }
    });

    $('#change-resolution').click(function() {
        if ($('#resolution-wrapper.open').length == 0) {
            $('#resolution-wrapper').addClass('open');
            $('#resolution-wrapper').removeClass('closed');
        } else {
            $('#resolution-wrapper').addClass('closed');
            $('#resolution-wrapper').removeClass('open');
        }
    });
    $('#resolution-column').mouseleave(function() {
        $('#resolution-wrapper').addClass('closed');
        $('#resolution-wrapper').removeClass('open');
    });

    $('#change-spacing').click(function() {
        if ($('#spacing-wrapper.open').length == 0) {
            $('#spacing-wrapper').addClass('open');
            $('#spacing-wrapper').removeClass('closed');
        } else {
            $('#spacing-wrapper').addClass('closed');
            $('#spacing-wrapper').removeClass('open');
        }
    });
    $('#spacing-column').mouseleave(function() {
        $('#spacing-wrapper').addClass('closed');
        $('#spacing-wrapper').removeClass('open');
    });

    $('#volume-control-wrapper').mouseleave(function() {
        if ($('#music-volume-control.open').length != 0) {
            $('#music-volume-control').addClass('closed');
            $('#music-volume-control').removeClass('open');
        }
    });

    low.onchange = function() {
        low_color = document.getElementById("low-color-picker").value;
        low_wrapper.style.backgroundColor = low_color;
    };
    high.onchange = function() {
        high_color = document.getElementById("high-color-picker").value;
        high_wrapper.style.backgroundColor = high_color;
    };
    undertone.onchange = function() {
        undertone_color = document.getElementById("undertone-color-picker").value;
        undertone_wrapper.style.backgroundColor = undertone_color;
    };
    background.onchange = function() {
        background_color = document.getElementById("background-color-picker").value;
        background_wrapper.style.backgroundColor = background_color;
    };

    $('#gradient-button-dark').on("click", function() {
        if (lightGradient == true) {
            lightGradient = false;
            $('#gradient-button-light').removeClass('btn-primary').addClass('btn-light');
            $('#gradient-button-dark').removeClass('btn-light').addClass('btn-primary');
        }
    });
    $('#gradient-button-light').on("click", function() {
        if (lightGradient == false) {
            lightGradient = true;
            $('#gradient-button-light').removeClass('btn-light').addClass('btn-primary');
            $('#gradient-button-dark').removeClass('btn-primary').addClass('btn-light');
        }
    });

    $('.color-input').on("click", function() {
        if (!editingProfile) {
            loadFromProfileID = null;

            $('#color-profile-edit-button').removeClass('btn-primary');
            $('#color-profile-edit-button').addClass('btn-light');
            $('#color-profile-delete-button').removeClass('btn-primary');
            $('#color-profile-delete-button').addClass('btn-light');

            $('.profile-selected').toggleClass('profile-selected');
        }
    });

    $('#colorpicker-toggle').on("click", function() {
        loadProfiles();
        if ($('#colorpicker.open').length == 0) {
            $('#colorpicker').addClass("open");
            $('#colorpicker').removeClass("closed");
            $('#header-bar').addClass("open");
            $('#header-bar').removeClass("closed");
        } else {
            $('#colorpicker').removeClass("open");
            $('#colorpicker').addClass("closed");
            $('#header-bar').removeClass("open");
            $('#header-bar').addClass("closed");
        }
    });

    $('#color-profile-random-button').on("click", function() {
        let chars = "0123456789ABCDEF";
        let randomColors = [];
        
        for (var col = 0; col < 4; col++) {
            let str = "#";
            for (var i = 0; i < 6; i++)
                str += chars.charAt(Math.floor(Math.random() * 16));
            randomColors[col] = str;
        }

        low_color = randomColors[0];
        high_color = randomColors[1];
        undertone_color = randomColors[2];
        background_color = randomColors[3];

        low.value = randomColors[0];
        high.value = randomColors[1];
        undertone.value = randomColors[2];
        background.value = randomColors[3];

        $('#low-color-input-wrapper').css("background-color", low_color);
        $('#high-color-input-wrapper').css("background-color", high_color);
        $('#undertone-color-input-wrapper').css("background-color", undertone_color);
        $('#background-color-input-wrapper').css("background-color", background_color);
    });

    $('#color-profile-save-button').on("click", function() {
        if (!editingProfile) {
            $('#save-profile-modal').css("display", "block");
            
            low_color = low.value;
            high_color = high.value;
            undertone_color = undertone.value;
            background_color = background.value;

            $('#low-color-save-wrapper').css("background-color", low_color);
            $('#high-color-save-wrapper').css("background-color", high_color);
            $('#undertone-color-save-wrapper').css("background-color", undertone_color);
            $('#background-color-save-wrapper').css("background-color", background_color);

            $('#save-profile-button').click(function(evt) {
                evt.stopImmediatePropagation();
                saveProfile(function() {
                    loadProfiles();
                });
            });
        }
    });
    $('#save-profile-modal-close').on("click", function() {
        $('#save-profile-modal').css("display", "none");
    });

    $('#color-profile-edit-button').on("click", function() {
        let json = localStorage.getItem($('.profile-selected')[0].id);
        let obj = JSON.parse(JSON.parse(json));
        
        if (!editingProfile) {
            editingProfile = true;

            $('#color-profile-save-button').removeClass('btn-primary');
            $('#color-profile-save-button').addClass('btn-light');
            $('#color-profile-delete-button').removeClass('btn-primary');
            $('#color-profile-delete-button').addClass('btn-light');
            document.getElementById('color-profile-edit-button').innerHTML = '<span class="glyphicon glyphicon-ok"></span>  Edit \"' + obj.name + '\"';

            low.value = obj.low;
            low_wrapper.style.backgroundColor = obj.low;
            high.value = obj.high;
            high_wrapper.style.backgroundColor = obj.high;
            undertone.value = obj.undertone;
            undertone_wrapper.style.backgroundColor = obj.undertone;
            background.value = obj.background;
            background_wrapper.style.backgroundColor = obj.background;

            loadFromProfileID = null;
        } else {
            editProfile(obj);
            editingProfile = false;

            $('#color-profile-save-button').removeClass('btn-light');
            $('#color-profile-save-button').addClass('btn-primary');
            $('#color-profile-delete-button').removeClass('btn-light');
            $('#color-profile-delete-button').addClass('btn-primary');
            document.getElementById('color-profile-edit-button').innerHTML = '<span class="glyphicon glyphicon-edit"></span> Edit Profile';

            loadFromProfileID = obj.id;
        }
    });

    $('#color-profile-delete-button').on("click", function() {
        if (!editingProfile) {
            $('#delete-profile-modal').css("display", "block");
            
            let json = localStorage.getItem($('.profile-selected')[0].id);
            let obj = JSON.parse(JSON.parse(json));

            low_color = obj.low;
            high_color = obj.high;
            undertone_color = obj.undertone;
            background_color = obj.background;

            $('#low-color-delete-wrapper').css("background-color", low_color);
            $('#high-color-delete-wrapper').css("background-color", high_color);
            $('#undertone-color-delete-wrapper').css("background-color", undertone_color);
            $('#background-color-delete-wrapper').css("background-color", background_color);

            document.getElementById("delete-profile-name").innerHTML = "\"" + obj.name + "\"";

            $('#cancel-delete-profile-button').on("click", function() {
                $('#delete-profile-modal').css("display", "none");
            });

            $('#delete-profile-button').on("click", function() {
                $('#delete-profile-modal').css("display", "none");
                deleteProfile(obj);
            });
        }
    });
    $('#delete-profile-modal-close').on("click", function() {
        $('#delete-profile-modal').css("display", "none");
    });

    function loadProfiles() {
        let profileCount = localStorage.getItem('profileCount');
        if (profileCount == null)
            profileCount = 0;

        for (i = 1; i <= profileCount; i++) {
            let json = localStorage.getItem('profile' + i);
            if (json == null)
                continue;

            var obj = JSON.parse(JSON.parse(json));
            if (document.getElementById('profile' + i) == null) {
                document.getElementById("color-profile-container").innerHTML +=
                ('<div class="row-md color-profile" id="' + obj.id + '">' +
                    '<h4>' + obj.name + '</h4>' + 
                    '<div class="color-profile-colors-wrapper">' +
                        '<div class="color-profile-color" id="' + (obj.id + "-low") + '" style="background-color: ' + obj.low + ';"></div>' +
                        '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.high + ';"></div>' +
                        '<div class="color-profile-color" id="' + (obj.id + "-undertone") + '" style="background-color: ' + obj.undertone + ';"></div>' +
                        '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.background + ';"></div>' + 
                    '</div>' + 
                '</div>');
            }
        }
    }

    function saveProfile(callback) {
        var profileCount = localStorage.getItem('profileCount');
        if (profileCount == null)
            profileCount = 0;

        var name = $('#save-profile-name').val();
        if (name == null || name.length == 0)
            name = "profile"+profileCount;
            
        profileCount++;
        localStorage.setItem('profileCount', profileCount);
        
        var text = '{ "id":"profile' + profileCount + '", '
        + '"name":"' + name + '", '
        + '"low":"' + low_color + '", '
        + '"high":"' + high_color + '", '
        + '"undertone":"' + undertone_color + '", '
        + '"background":"' + background_color + '"}';
        
        localStorage.setItem('profile' + profileCount, JSON.stringify(text));
        $('#save-profile-modal').css("display", "none");

        callback();
    };

    function editProfile(obj) {
        let row = ('<div class="row-md color-profile profile-selected" id="' + obj.id + '">' +
            '<h4>' + obj.name + '</h4>' + 
            '<div class="color-profile-colors-wrapper">' +
                '<div class="color-profile-color" id="' + (obj.id + "-low") + '" style="background-color: ' + obj.low + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.high + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-undertone") + '" style="background-color: ' + obj.undertone + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.background + ';"></div>' + 
            '</div>' + 
        '</div>');
        
        let colors = getColors();
        obj.low = colors[0];
        obj.high = colors[1];
        obj.undertone = colors[2];
        obj.background = colors[3];

        localStorage.setItem(obj.id, JSON.stringify(JSON.stringify(obj)));

        let str = document.getElementById("color-profile-container").innerHTML;
        let new_row = ('<div class="row-md color-profile profile-selected" id="' + obj.id + '">' +
            '<h4>' + obj.name + '</h4>' + 
            '<div class="color-profile-colors-wrapper">' +
                '<div class="color-profile-color" id="' + (obj.id + "-low") + '" style="background-color: ' + obj.low + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.high + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-undertone") + '" style="background-color: ' + obj.undertone + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.background + ';"></div>' + 
            '</div>' + 
        '</div>');

        str = str.replace(row, new_row);

        document.getElementById("color-profile-container").innerHTML = str;
    }

    function deleteProfile(obj) {
        localStorage.removeItem(obj.id);

        let str = document.getElementById("color-profile-container").innerHTML;
        let row = ('<div class="row-md color-profile profile-selected" id="' + obj.id + '">' +
            '<h4>' + obj.name + '</h4>' + 
            '<div class="color-profile-colors-wrapper">' +
                '<div class="color-profile-color" id="' + (obj.id + "-low") + '" style="background-color: ' + obj.low + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.high + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-undertone") + '" style="background-color: ' + obj.undertone + ';"></div>' +
                '<div class="color-profile-color" id="' + (obj.id + "-high") + '" style="background-color: ' + obj.background + ';"></div>' + 
            '</div>' + 
        '</div>');
        str = str.replace(row, "");

        document.getElementById("color-profile-container").innerHTML = str;

        loadFromProfileID = null;
    }

    /******************** Audio Controls ********************/
    /*$('.music-file-play').click(function() {
        let filePath = audio.src.split("/");
        let path = this.id + ".mp3";
        if (filePath[5] != path) {
            audio.src = "../audio/" + path;
            audio.load();
        }
        if (audio.paused) {
            audio.play();
            let id = "#" + this.id;
            $(id).removeClass('glyphicon-play').addClass('glyphicon-pause');
            $('#music-play').removeClass('glyphicon-play').addClass('glyphicon-pause');
        } else {
            let id = "#" + this.id;
            audio.pause();
            $(id).removeClass('glyphicon-pause').addClass('glyphicon-play');
            $('#music-play').removeClass('glyphicon-pause').addClass('glyphicon-play');
        }
    });*/

    $('#audiofile').on('change', function() {
        audio.src = URL.createObjectURL(this.files[0]);
        $('#current-song-name').html('<h5 style="margin: 0px;">' + this.files[0].name.replace(".mp3", "") + '</h5>');
        audio.load();
        audio.play();
    });

    audio.volume = localStorage.getItem('volume');
    $('#music-volume-control-slider').val(audio.volume);
    if (audio.volume == 0) 
        $('#music-change-volume').addClass('glyphicon-volume-off');
    else if (audio.volume < 0.5)
        $('#music-change-volume').addClass('glyphicon-volume-down');
    else
        $('#music-change-volume').addClass('glyphicon-volume-up');

    changeTime();
    
    function changeTime() {
        let currentTime = Math.floor(audio.currentTime/60) + ":";
        if (audio.currentTime % 60 < 10)
            currentTime += "0" + Math.floor(audio.currentTime % 60);
        else
            currentTime += (String)(Math.floor(audio.currentTime % 60));

        let totalTime = (Math.floor(audio.duration/60) + ":");
        if (audio.duration % 60 < 10)
            totalTime += "0" + Math.floor(audio.duration % 60);
        else
            totalTime += (String)(Math.floor(audio.duration % 60));

        if (totalTime.includes("NaN"))
            totalTime = "0:00";
        
        $('#music-current-time').html(currentTime);
        $('#music-total-time').html(totalTime);

        document.getElementById('music-progress-slider').max = audio.duration;
        document.getElementById('music-progress-slider').value = audio.currentTime;
    }

    audio.ontimeupdate = function() {
        changeTime();
    }
    audio.onloadeddata = function() {
        changeTime();
    }

    $('#music-progress-slider').on('change', function() {
        audio.currentTime = this.value;
    });

    $('#music-play').click(function() {
        if (audio.paused && audio.src)
            audio.play();
        else
            audio.pause();
    });
    $('#music-change-volume').click(function() {
        if ($('#music-volume-control.open').length == 0) {
            $('#music-volume-control').addClass('open');
            $('#music-volume-control').removeClass('closed');
        } else {
            $('#music-volume-control').addClass('closed');
            $('#music-volume-control').removeClass('open');
        }
    });
    $('#music-volume-control-slider').on('change', function() {
        audio.volume = this.value;
        localStorage.setItem('volume', this.value);
        if (this.value == 0) {
            $('#music-change-volume').removeClass('glyphicon-volume-up');
            $('#music-change-volume').removeClass('glyphicon-volume-down');
            $('#music-change-volume').addClass('glyphicon-volume-off');
        } else if (this.value < 0.5) {
            $('#music-change-volume').removeClass('glyphicon-volume-up');
            $('#music-change-volume').removeClass('glyphicon-volume-off');
            $('#music-change-volume').addClass('glyphicon-volume-down');
        }else {
            $('#music-change-volume').removeClass('glyphicon-volume-down');
            $('#music-change-volume').removeClass('glyphicon-volume-off');
            $('#music-change-volume').addClass('glyphicon-volume-up');
        }
    });
};