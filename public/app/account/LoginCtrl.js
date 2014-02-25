app.controller('IndexCtrl', ['$scope', '$http', function ($scope, $http) {
        console.log('indexCtrl');

    $scope.loggedInUser = {};
    $scope.isLoggedIn = function () {
        return !_.isEmpty($scope.loggedInUser);
    };
    $http.get('/api/user/details').success(function (user) {
        if (!_.isEmpty(user)) {
            $scope.loggedInUser = user;
        }
    });
    $scope.showAdminLink = function() {
        return _.contains($scope.loggedInUser.roles, 'a');
    };
    $scope.$on('userLog', function (event, user) {
        console.log(event);
        console.log('user ' + JSON.stringify(user));
        $scope.loggedInUser = user;
    });
    //$scope.loggedInUser = $cookieStore.get('trackr.sess').username || {};
}]);

app.controller('LoginCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    console.log('loginctrl');

    $scope.credentials = {};

    $scope.validateCredentials = function (credentials) {
        $http.post('/api/login', credentials).
		success(function (response) {
		    if (response.success) {
		        $scope.$emit('userLog', response.user);
		        $location.path('/user/' + response.user.username);
		    } else {
		        $scope.errorMessage = response.message;
		    }
		}).
		error(function (response) {
		    console.log(response);
		});
    };

    $scope.validateFields = function () {
        return $scope.loginForm.$valid;
    };
}]);

app.controller('RegisterCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    console.log('registerctrl');

    $scope.credentials = { email: '', username: '', password: ''};

    $scope.registerCredentials = function () {
        $http.post('/api/register', $scope.credentials).
		success(function (response) {
		    console.log(JSON.stringify(response));
		    if (response.success) {
		        $scope.$emit('userLog', response.user);
		        $location.path('/user/' + response.user.username);
		    } else {
		        $scope.errorMessage = response.message;
		    }
		}).
		error(function (response, status) {
		    if (status === 409) {
		        $scope.errorMessage = 'Användarnamnet upptaget, välj ett annat.';
		    }
		});
    };

    $scope.validateFields = function () {
        return $scope.regForm.$valid;
    };
}]);

app.controller('LogoutCtrl', function ($scope, $location, $http, $rootScope) {
    $scope.logout = function () {
        $http.post('/api/logout').
            success(function () {
                $scope.$emit('userLog', {});
                $location.path('/login');
            });
    };
});