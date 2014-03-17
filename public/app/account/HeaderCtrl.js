app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'SearchService', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, SearchService, consoles) {
        console.log('header');
        $rootScope.consoles = consoles;
        $scope.consoles = $rootScope.consoles;
        if ($location.$$path.split('/').length === 2) {
            $location.path('/' + $rootScope.consoles[0].id + '/').replace();
        }

        $scope.consoleName = $stateParams.consoleName;
        $scope.changeConsole = function(c) {
            $location.path('/' + c.id + '/').replace();
        };

        $scope.search = function() {
            SearchService.Search($scope);
        };
    }]);

app.controller('UserHeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'SearchService', 'stats', 'attrs',
    function ($scope, $location, $state, $stateParams, $rootScope, SearchService, stats, attrs) {
        console.log('userheader');
        $rootScope.stats = stats;
        $scope.userAttrs = attrs;
        $scope.userName = $stateParams.userName;
        $scope.stats = $rootScope.stats;
        $scope.consoleName = $rootScope.stats[0].id;

        if ($location.$$path.split('/').length === 3) {
            if ($rootScope.stats.length) {
                $location.path('/user/' + $stateParams.userName + '/' + $rootScope.stats[0].id + '/').replace();
            }
        }

        $scope.$on('consoleChanged', function (event, data) {
            console.log(data);
            $scope.consoleName = data;
        });
        
        $scope.search = function () {
            SearchService.Search($scope);
        };
    }]);

app.controller('AdminHeaderCtrl', ['$scope', '$location',
    function ($scope, $location) {
        console.log('adminheader');

        if ($location.$$path.split('/').length === 2) {
            $location.path('/admin/index').replace();
        }
    }]);