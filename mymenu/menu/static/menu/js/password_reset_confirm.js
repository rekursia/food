function handleAuthErrors(errors) {
    $('#password-reset-block').find(".auth-data").addClass('error');

    for (name in errors) {
        for (var i=0; i<errors[name].length; i++) {
            $('form[name="passwordResetConfirmForm"] input[name="'+ name +'"]').parent("div").addClass('error');
            $('form[name="passwordResetConfirmForm"] input[name="'+ name +'"]').siblings(".error-text").append(errors[name][i]);
            notify(errors[name][i], 'error');
        }
    }
};


function removeAuthErrors() {
    $('#password-reset-block').find(".auth-data").removeClass('error');
    $('#password-reset-block').find(".auth-data .error" ).removeClass('error');
    $('#password-reset-block').find(".auth-data .error-text" ).empty();
};

function password_reset_confirm() {
    removeAuthErrors();
    var data = {
        'uid': $('form[name="passwordResetConfirmForm"] input[name="uid"]').val(),
        'token': $('form[name="passwordResetConfirmForm"] input[name="token"]').val(),
        'new_password1': $('form[name="passwordResetConfirmForm"] input[name="new_password1"]').val(),
        'new_password2': $('form[name="passwordResetConfirmForm"] input[name="new_password2"]').val()
    };
    //edit
    $.ajax({
        url: '/rest-auth/password/reset/confirm/',
        type: 'POST',
        data: data,
        dataType: 'json',
        success: function (result) {
            window.location.replace("/");
        },
        error: function (result) {
            handleAuthErrors(result.responseJSON);
        }
    });
};