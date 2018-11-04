MenuApp.profile = {};

(function(scope) {
    var _authentificationForms = {
        'profile': {
            'title': 'Профиль пользователя',
            'name': 'profileForm',
            'block': '#profile-block',
        },
        'change-password': {
            'title': 'Сменить пароль',
            'name': 'changePasswordForm',
            'block': '#change-password-block',
        }
    };

    var _currentType = 'profile';

    var _initProfileData = function(data) {
        if (data) {
            $('form[name="profileForm"] input[name="username"]').val(data.username);
            $('form[name="profileForm"] input[name="first_name"]').val(data.first_name);
            $('form[name="profileForm"] input[name="last_name"]').val(data.last_name);
        }
    };

    var _handleAuthErrors = function(errors) {
        var sets = _authentificationForms[_currentType];
        $(sets['block']).find(".auth-data").addClass('error');

        for (var name in errors) {
            for (var i = 0; i < errors[name].length; i++) {
                $('form[name="' + sets.name + '"] input[name="' + name + '"]').parent("div").addClass('error');
                $('form[name="' + sets.name + '"] input[name="' + name + '"]').siblings(".error-text").append(errors[name][i]);
                MenuApp.common.notify(errors[name][i], 'error');
            }
        }
    };

    var _removeAuthErrors = function() {
        var sets = _authentificationForms[_currentType];
        $(sets['block']).find(".auth-data").removeClass('error');
        $(sets['block']).find(".auth-data .error").removeClass('error');
        $(sets['block']).find(".auth-data .error-text").empty();
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

    scope.changeProfile = function() {
        _removeAuthErrors();
        var data = {
            'username': $('form[name="profileForm"] input[name="username"]').val(),
            'first_name': $('form[name="profileForm"] input[name="first_name"]').val(),
            'last_name': $('form[name="profileForm"] input[name="last_name"]').val()
        };
        //edit
        $.ajax({
            url: '/rest-auth/user/',
            type: 'PUT',
            data: data,
            dataType: 'json',
            success: function (result) {
                MenuApp.common.notify('Профиль был успешно изменен', 'success');
                //window.location.replace("/menu/");
            },
            error: function (result) {
                _handleAuthErrors(result.responseJSON);
            }
        });
    };

    scope.changePassword = function() {
        _removeAuthErrors();
        var data = {
            'new_password1': $('form[name="changePasswordForm"] input[name="new_password1"]').val(),
            'new_password2': $('form[name="changePasswordForm"] input[name="new_password2"]').val(),
            'old_password': $('form[name="changePasswordForm"] input[name="old_password"]').val()
        };
        //edit
        $.ajax({
            url: '/rest-auth/password/change/',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function (result) {
                MenuApp.common.notify('Пароль был успешно изменен', 'success');
                window.location.replace("/");
            },
            error: function (result) {
                _handleAuthErrors(result.responseJSON);
            }
        });
    };

    //Инициализируем форму
    scope.setType('profile');
    //получить данные пользователя и заполнить полученными данными форму
    MenuApp.common.getProfile(_initProfileData);

})(MenuApp.profile);




