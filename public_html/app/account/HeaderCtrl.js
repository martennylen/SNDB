app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'SearchService', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, SearchService, consoles) {
        console.log('header');
        $rootScope.consoles = consoles;
        $scope.consoles = $rootScope.consoles;
        $scope.q = '';
        
        var n = 7;
        $scope.displayConsoles = _.chain($scope.consoles).groupBy(function(element, index){
            return Math.floor(index/n);
        }).toArray().value();

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                if (toState.name === 'all' && _.str.include(fromState.name, "all")) {
                    event.preventDefault();
                }
            });

        if ($location.$$path.split('/').length === 2) {
            $location.path('/all/' + $rootScope.consoles[0].id + '/').replace();
        }

        $scope.consoleName = $scope.consoles[0].id;

        $scope.$on('consoleChanged', function (event, data) {
            console.log(data);
            $scope.consoleName = data;
        });

        $scope.search = function() {
            SearchService.Search($scope);
        };

        $scope.clearSearch = function() {
            $scope.q = '';
            $scope.search();
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

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                if (toState.name === 'user' && _.str.include(fromState.name, "user")) {
                    event.preventDefault();
                }
            });

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

        $scope.clearSearch = function () {
            $scope.q = '';
            $scope.search();
        };
    }]);

app.controller('AdminHeaderCtrl', ['$scope', '$location',
    function ($scope, $location) {
        console.log('adminheader');

        if ($location.$$path.split('/').length === 2) {
            $location.path('/admin/index').replace();
        }
    }]);