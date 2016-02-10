app.controller('RegisterCtrl', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    console.log('registerctrl');

    $scope.credentials = { email: '', username: '', password: '' };

    $scope.registerCredentials = function () {
        $scope.credentials.displayName = $scope.credentials.username;
        $scope.credentials.username = $scope.credentials.displayName.toLowerCase();
        
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