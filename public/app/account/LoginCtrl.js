app.controller('IndexCtrl', function ($scope, consoles, $http, $rootScope) {
    $scope.consoles = consoles;
    console.log('index');
    $rootScope.loggedInUser = {};
    $scope.isLoggedIn = function() {
        return !_.isEmpty($rootScope.loggedInUser);
    };
    $http.get('/api/user/details').success(function (user) {
        if (!_.isEmpty(user)) {
            $rootScope.loggedInUser = { userName: user.username };
            console.log($scope.isLoggedIn());
        }
    });
    //$scope.loggedInUser = $cookieStore.get('trackr.sess').username || {};
});

app.controller('LoginCtrl', function ($scope, $location, $http, $rootScope) {
    console.log('loginctrl');

    $scope.credentials = {};
    $scope.$on('userRegistration', function(user) {
        setUpLogin(user);
    });

    $scope.validateCredentials = function (credentials) {
        $http.post('/api/login', credentials).
		success(function (response) {
		    if (response.success) {
		        setUpLogin(user);
		    } else {
		        $scope.errorMessage = response.message;
		    }
		}).
		error(function (response) {
		    console.log(response);
		});
    };

    var setUpLogin = function(user) {
        $rootScope.loggedInUser = user.username;
        $location.path('/user/' + user.username + '/nes');
    };
});

app.controller('RegisterCtrl', function ($scope, $location, $http) {
    console.log('registerctrl');

    $scope.credentials = { mail: '', username: '', password: ''};

    $scope.registerCredentials = function () {
        $http.post('/api/register', $scope.credentials).
		success(function (response) {
		    if (response.success) {
		        $scope.$emit('userRegistration', response.user);
		    } else {
		        $scope.errorMessage = response.message;
		    }
		}).
		error(function (response) {
		    console.log(response);
		});
    };

    $scope.validateFields = function () {
        //console.log($scope.credentials);
        //console.log($scope.credentials.mail.length > 0 && $scope.credentials.username.length > 0 && $scope.credentials.password.length > 0);
        //return $scope.credentials.mail.length > 0 && $scope.credentials.username.length > 0 && $scope.credentials.password.length > 0;
        return $scope.form.$valid;
    };
});

app.controller('LogoutCtrl', function ($scope, $location, $http, $rootScope) {
    $scope.logout = function () {
        $http.post('/api/logout').
            success(function (response) {
                $rootScope.loggedInUser = '';
                $location.path('/');
            });
    };
});