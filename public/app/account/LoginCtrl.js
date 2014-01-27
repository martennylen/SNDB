app.controller('IndexCtrl', function ($scope, consoles, $http, $rootScope) {
    $scope.consoles = consoles;
    console.log('index');
    $http.get('/api/user/details').success(function (user) {
        if (!_.isEmpty(user)) {
            $rootScope.loggedInUser = user.username;
        }
    });
    //$scope.loggedInUser = $cookieStore.get('trackr.sess').username || {};
});

app.controller('LoginCtrl', function ($scope, $location, $http, $rootScope) {
    console.log('loginctrl');

    $scope.credentials = {};

    $scope.validateCredentials = function (data) {
        $http.post('/api/login', data).
		success(function (response) {
		    if (response.success) {
		        $rootScope.loggedInUser = response.user.username;
		        $location.path('/user/' + response.user.username + '/nes');
		    } else {
		        $scope.errorMessage = response.message;
		    }
		}).
		error(function (response) {
		    console.log(response);
		});
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