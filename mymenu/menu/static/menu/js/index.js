MenuApp.authorization = {};

(function(scope) {
    var _authentificationForms = {
        'login': {
            'title': 'Авторизация',
            'name': 'loginForm',
            'block': '#login-block',
        },
        'registration': {
            'title': 'Регистрация',
            'name': 'registerForm',
            'block': '#register-block',
        },
        'reset-password': {
            'title': 'Восстановить пароль',
            'name': 'resetPasswordForm',
            'block': '#reset-password-block',
        },
    };

    var _currentType = 'login';

    var _handleAuthErrors = function(errors) {
        var sets = _authentificationForms[_currentType];
        $(sets['block']).find(".auth-data").addClass('error');

        for (name in errors) {
            for (var i=0; i<errors[name].length; i++) {
                $('form[name="'+sets.name+'"] input[name="'+ name +'"]').parent("div").addClass('error');
                $('form[name="'+ sets.name +'"] input[name="'+ name +'"]').siblings(".error-text").append(errors[name][i]);
                MenuApp.common.notify(errors[name][i], 'error');
            }
        }
    };

    var _removeAuthErrors = function() {
        var sets = _authentificationForms[_currentType];
        $(sets['block']).find(".auth-data").removeClass('error');
        $(sets['block']).find(".auth-data .error" ).removeClass('error');
        $(sets['block']).find(".auth-data .error-text" ).empty();
    };

    scope.setType = function(type) {
        _currentType = type;
        var sets = _authentificationForms[type];
        $('.data-block-title h1').html(sets.title);
        $('title').html(sets.title);
        for (var t in _authentificationForms) {
            //hide all forms
            $(_authentificationForms[t]['block']).hide();
        }
        //show current form
        $(sets['block']).show();
    };

    scope.login = function() {
        _removeAuthErrors();
        var data = {
            'username': $('form[name="loginForm"] input[name="username"]').val(),
            'password': $('form[name="loginForm"] input[name="password"]').val()
        };

        //edit
        $.ajax({
            url: '/rest-auth/login/',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function (result) {
                window.location.replace("/menu/");
            },
            error: function (result) {
                _handleAuthErrors(result.responseJSON);
            }
        });
    };

    scope.register = function() {
        _removeAuthErrors();
        var data = {
            'username': $('form[name="registerForm"] input[name="username"]').val(),
            'email': $('form[name="registerForm"] input[name="email"]').val(),
            'password1': $('form[name="registerForm"] input[name="password1"]').val(),
            'password2': $('form[name="registerForm"] input[name="password2"]').val()
        };
        //edit
        $.ajax({
            url: '/rest-auth/registration/',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function (result) {
                MenuApp.common.notify('Данные для подтверждения регистрации высланы на Ваш e-mail', 'success');
                //window.location.replace("/menu/");
            },
            error: function (result) {
                _handleAuthErrors(result.responseJSON);
            }
        });
    };

    scope.resetPassword = function() {
        _removeAuthErrors();
        var data = {
            'email': $('form[name="resetPasswordForm"] input[name="email"]').val()
        };
        //edit
        $.ajax({
            url: '/rest-auth/password/reset/',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function (result) {
                MenuApp.common.notify('Данные для восстановления высланы на Ваш e-mail', 'success');
                //window.location.replace("/menu/");
            },
            error: function (result) {
                _handleAuthErrors(result.responseJSON);
            }
        });
    };

    $('form[name="loginForm"]').keypress(function (event) {
        if (event.keyCode === 13) { // enter key
            event.preventDefault();
            scope.login();
        }
    });
    $('form[name="registerForm"]').keypress(function (event) {
        if (event.keyCode === 13) { // enter key
            event.preventDefault();
            scope.register();
        }
    });
    $('form[name="resetPasswordForm"]').keypress(function (event) {
        if (event.keyCode === 13) { // enter key
            event.preventDefault();
            scope.resetPassword();
        }
    });

    scope.setType(_currentType);

})(MenuApp.authorization);