//Основной модуль приложения
var MenuApp = {};

(function(scope) {
    //Конфиги приложения
    scope.config = {
        'api_url': '/api/v1/'
    };

    //Общее для разных модулей
    scope.common = {
        'notify': function (message, type) {
            var n = new Noty({
                text: message,
                type: type,
                timeout: 2000,
                layout: 'topRight'
            }).show();
        },
        'logout': function() {
            $.ajax({
                url: '/rest-auth/logout/',
                type: 'POST',
                data: {},
                dataType: 'json',
                success: function (result) {
                    window.location.replace("/");
                },
                error: function (result) {
                    console.log(result.responseJSON);
                }
            });
        },
        'getProfile': function(callback) {
            $.ajax({
                url: '/rest-auth/user/',
                type: 'GET',
                data: {},
                dataType: 'json',
                success: function (result) {
                    callback(result);
                },
                error: function (result) {
                    console.log(result.responseJSON);
                }
            });
        }
    };

    //set csrftoken
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            function getCookie(name) {
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                 var cookies = document.cookie.split(';');
                 for (var i = 0; i < cookies.length; i++) {
                     var cookie = jQuery.trim(cookies[i]);
                     // Does this cookie string begin with the name we want?
                     if (cookie.substring(0, name.length + 1) == (name + '=')) {
                         cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                         break;
                     }
                 }
                }
                return cookieValue;
            }
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });

})(MenuApp);
