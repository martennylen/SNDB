app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, consoles) {
        console.log('header');
        $rootScope.consoles = consoles;
        $scope.consoles = $rootScope.consoles;
        if ($location.$$path.split('/').length === 2) {
            $location.path('/' + $rootScope.consoles[0].id + '/').replace();
        }
    }]);

app.controller('UserHeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'stats',
    function ($scope, $location, $state, $stateParams, $rootScope, stats) {
        console.log('userheader');
        $rootScope.stats = stats;
        $scope.stats = $rootScope.stats;
        console.log($location.$$path.split('/').length);
        if ($location.$$path.split('/').length === 3) {
            $location.path('/user/' + $stateParams.userName + '/' + $rootScope.stats[0].id + '/').replace();
        }
    }]);