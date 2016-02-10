app.controller('IndexCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
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
        $scope.loggedInUser = user;
    });

    $scope.burgerIsOpen = false;
    $scope.toggleBurger = function () {
        $scope.burgerIsOpen = !$scope.burgerIsOpen;
        document.getElementById('cart-holder').style.height = $scope.burgerIsOpen ? '100%' : 0;
    };

    $scope.logout = function () {
        $http.post('/api/logout').
            success(function () {
                $scope.toggleBurger();
                $scope.$emit('userLog', {});
                $location.path('/login');
            });
    };
    //$scope.loggedInUser = $cookieStore.get('trackr.sess').username || {};
}]);

app.controller('LoginCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    console.log('loginctrl');

    $scope.credentials = {};

    $scope.validateCredentials = function (credentials) {
        credentials = { 'username': credentials.username, 'password': credentials.password };
        
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