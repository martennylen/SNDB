app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', 'SearchService', 'consoleStats', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, SearchService, consoleStats, consoles) {
        console.log('header');
        //$rootScope.consoles = consoles;
        $scope.consoles = consoleStats;
        //console.log($scope.consoles);
        $scope.q = '';
        
        //var n = 7;
        //$scope.displayConsoles = _.chain($scope.consoles).groupBy(function(element, index){
        //    return Math.floor(index/n);
        //}).toArray().value();

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                if (toState.name === 'all' && _.str.include(fromState.name, "all")) {
                    event.preventDefault();
                }
            });

        if ($location.$$path.split('/').length === 2) {
            $location.path('/all/' + consoles[0].id + '/').replace();
        }
        
        if ($location.$$path.split('/').length === 3 && _.last($location.$$path) !== '/') {
            $location.path('/all/' + $stateParams.consoleName + '/').replace();
        }

        $scope.consoleName = consoles[0].id;

        $scope.$on('consoleChanged', function (event, data) {
            $scope.currentConsole = data;
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
        $scope.userExists = stats.$resolved && attrs.$resolved;

        console.log(stats);
        $rootScope.stats = stats;
        $scope.userAttrs = attrs;
        $scope.userName = $stateParams.userName;
        $scope.stats = $rootScope.stats;
        $scope.consoleName = $rootScope.stats.length ? $rootScope.stats[0].id : 'nes';

        $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                if (toState.name === 'user' && _.str.include(fromState.name, "user")) {
                    if(toParams.userName === fromParams.userName)
                    event.preventDefault();
                }
            });

        if ($location.$$path.split('/').length === 3) {
            if ($rootScope.stats.length) {
                $location.path('/user/' + $stateParams.userName.toLowerCase() + '/' + $rootScope.stats[0].id + '/').replace();
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