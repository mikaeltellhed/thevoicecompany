var domain = {
    name: 'the-voice-company-inc',
    authEndpoint: 'https://sr00k2wi9j.execute-api.us-east-1.amazonaws.com/Prod',
    userPoolId: 'us-east-1_PzkaooMyx',
    clientId: '25oam048dbleodcvc86p7u6jaf'
}

function switchToPane(pane) {
    hideMessages();

    $('#front-pane').css({ 'display': pane === 'front' ? '' : 'none' });
    $('#signup-pane').css({ 'display': pane === 'signup' ? '' : 'none' });
    $('#confirmuser-pane').css({ 'display': pane === 'confirmuser' ? '' : 'none' });
    $('#signin-pane').css({ 'display': pane === 'signin' ? '' : 'none' });
    $('#forgot-password-pane').css({ 'display': pane === 'forgot-password' ? '' : 'none' });
    $('#setup-pane').css({ 'display': pane === 'setup' ? '' : 'none' });
}

function showActivity() {
    $('#activity').show();
}

function hideActivity() {
    $('#activity').hide();
}

function hideMessages() {
    $('#error-msg').hide();
    $('#toast-msg').hide();
}

function showError(text) {
    $('#error-text').html(text);
    $('#error-msg').show();
}

function showToast(text) {
    $('#toast-text').html(text);
    $('#toast-msg').show();
}

function signUp(name, email, password) {
    var poolData = {
        UserPoolId: getDomainInfo().userPoolId,
        ClientId: getDomainInfo().clientId,
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var attributeList = [];

    var dataEmail = {

    };

    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: 'email',
        Value: email
    }));

    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: 'name',
        Value: name
    }));

    hideMessages();
    showActivity();

    userPool.signUp(email, password, attributeList, null, function (err, result) {
        hideActivity();

        if (err) {
            showError(err.message || JSON.stringify(err));
            return;
        }
        else switchToPane('confirmuser');
    });
}

function confirmUser(username, password, code) {
    var poolData = {
        UserPoolId: getDomainInfo().userPoolId,
        ClientId: getDomainInfo().clientId,
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool
    };

    hideMessages();
    showActivity();

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function (err, result) {
        hideActivity();

        if (err) {
            showError(err.message || JSON.stringify(err));
            return;
        }
        signIn(username, password);
    });
}

function signIn(username, password) {
    var authenticationData = {
        Username: username,
        Password: password,
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
    var poolData = {
        UserPoolId: getDomainInfo().userPoolId,
        ClientId: getDomainInfo().clientId,
    };
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool
    };

    hideMessages();
    showActivity();

    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            hideActivity();

            window.__noodlAuth = {
                domain: getDomainInfo().name,
                accessToken: result.getAccessToken().getJwtToken(),
                idToken: result.getIdToken().getJwtToken(),
                refreshToken: result.getRefreshToken().getToken()
            }
            switchToPane('setup');
        },

        onFailure: function (err) {
            hideActivity();
            showError(err.message || JSON.stringify(err));
        },

    });
}

function forgotPassword(username) {
    var poolData = {
        UserPoolId: getDomainInfo().userPoolId,
        ClientId: getDomainInfo().clientId,
    };
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool
    };

    hideMessages();
    showActivity();

    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.forgotPassword({
        onSuccess: function (data) {
            hideActivity();
            showToast('A verification code have been sent to your email.')
        },
        onFailure: function (err) {
            hideActivity();
            showError('Failed to send verification code. (' + err.message || JSON.stringify(err) + ')')
        }
    });
}

function confirmPassword(username, newPassword, verificationCode) {
    var poolData = {
        UserPoolId: getDomainInfo().userPoolId,
        ClientId: getDomainInfo().clientId,
    };
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
    var userData = {
        Username: username,
        Pool: userPool
    };

    hideMessages();
    showActivity();

    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.confirmPassword(verificationCode, newPassword, {
        onSuccess() {
            hideActivity();
            showToast('Password successfully changed.');
            switchToPane('signin');
        },
        onFailure(err) {
            hideActivity();
            showError('Failed to change password. (' + err.message || JSON.stringify(err) + ')');
        }
    });
}

function launchNoodl() {
    showActivity();

    function requestComplete() {
        hideActivity();

        if (this.status == 200) {
            var r = JSON.parse(this.response);
            var uri = 'noodl:' + getDomainInfo().name + '/' + r.uri;
            console.log(uri);
            window.location.href = uri;
        }
        else {
            showError('Failed to launch Noodl');
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', getDomainInfo().authEndpoint + '/auth/uri');
    xhr.onloadend = requestComplete;
    xhr.onerror = requestComplete;
    xhr.send(JSON.stringify(window.__noodlAuth));   
}

function getDomainInfo() {
    return domain;
}

$(function () {

    // Get started
    $('.getstarted-button').on('click', function () {
        switchToPane('signup');
    })

    // Sign up
    function signUpClicked() {
        var name = $('#signup-name').val();
        var email = $('#signup-email').val();
        var password = $('#signup-password').val();
        signUp(name, email, password);
    }

    $('#signup-pane').on('keyup', e => {
        if (e.keyCode === 13) {
            signUpClicked();
        }
    });

    $('.signup-button').on('click', signUpClicked)

    $('.goto-signin').on('click', function () {
        switchToPane('signin');
    })

    // Confirm
    function confirmClicked() {
        var code = $('#confirm-code').val();
        var email = $('#signup-email').val();
        var password = $('#signup-password').val();
        confirmUser(email, password, code);
    }

    $('#confirmuser-pane').on('keyup', e => {
        if (e.keyCode === 13) {
            signUpClicked();
        }
    });

    $('.confirm-button').on('click', confirmClicked)

    // Sign in
    function signInClicked() {
        var username = $('#signin-email').val();
        var password = $('#signin-password').val();
        signIn(username, password);
    }

    $('#signin-pane').on('keyup', e => {
        if (e.keyCode === 13) {
            signInClicked();
        }
    });

    $('.signin-button').on('click', signInClicked)

    $('.goto-signup').on('click', function () {
        switchToPane('signup');
    })

    // Forgot password
    $('.forgot-password').on('click', function () {
        switchToPane('forgot-password');
    })

    $('.back-to-signin').on('click', function () {
        switchToPane('signin');
    })

    $('.send-code').on('click', function () {
        forgotPassword($('#forgot-password-email').val())
    })

    $('.change-password').on('click', function () {
        var username = $('#forgot-password-email').val();
        var newPassword = $('#forgot-password-password').val();
        var verificationCode = $('#forgot-password-code').val();
        confirmPassword(username, newPassword, verificationCode);
    })

    // Setup
    $('.launch-button').on('click', launchNoodl);

})