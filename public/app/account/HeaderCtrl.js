app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, consoles) {
        console.log('header');
        $rootScope.consoles = consoles;
        $scope.KUKEN = $rootScope.consoles;
        if ($location.$$path.split('/').length === 2) {
            $location.path('/' + $rootScope.consoles[0].id + '/').replace();
        }
    }]);