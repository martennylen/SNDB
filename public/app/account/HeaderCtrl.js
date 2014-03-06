app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, consoles) {
        console.log('header');
        $rootScope.consoles = consoles;
        $scope.consoles = $rootScope.consoles;
        if ($location.$$path.split('/').length === 2) {
            $location.path('/' + $rootScope.consoles[0].id + '/').replace();
        }
    }]);

app.controller('UserHeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'stats', 'attrs',
    function ($scope, $location, $state, $stateParams, $rootScope, stats, attrs) {
        console.log('userheader');
        $rootScope.stats = stats;
        $scope.userAttrs = attrs;
        $scope.userName = $stateParams.userName;
        $scope.stats = $rootScope.stats;

        if ($location.$$path.split('/').length === 3) {
            if ($rootScope.stats.length) {
                $location.path('/user/' + $stateParams.userName + '/' + $rootScope.stats[0].id + '/').replace();
            }
        }
    }]);

app.controller('AdminHeaderCtrl', ['$scope', '$location',
    function ($scope, $location) {
        console.log('adminheader');

        if ($location.$$path.split('/').length === 2) {
            $location.path('/admin/index').replace();
        }
    }]);