app.controller('HeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', '$timeout', '$http', 'consoles',
    function ($scope, $location, $state, $stateParams, $rootScope, $timeout, $http, consoles) {
        console.log('header');
        $rootScope.consoles = consoles;
        $scope.consoles = $rootScope.consoles;
        if ($location.$$path.split('/').length === 2) {
            $location.path('/' + $rootScope.consoles[0].id + '/').replace();
        }

        $scope.console = $stateParams.consoleName;
        $scope.changeConsole = function(c) {
            $location.path('/' + c.id + '/').replace();
        };

        var latestResults = [];
        var searchResults = [];
        $scope.search = function () {

            if ($scope.q === undefined) {
                return;
            }

            if ($scope.q.length === 0) {
                $scope.$broadcast('searchResult', null, false);
                $scope.showQ = false;
                return;
            }

            var oldies = _.filter(latestResults, function (game) {
                return _.any(game.tags, function (tag) {
                    return _(tag).startsWith($scope.q);
                });
            });

            if (oldies.length === 0) {
                searchThrottled($scope);
            } else {
                searchResults = oldies;
            }
        };

        var searchDelayed = function ($scope) {
            $scope.$apply(function () { searchAction($scope); });
        };

        var searchThrottled = _.debounce(searchDelayed, 1000);

        var searchAction = function ($scope) {
            if ($scope.q !== undefined && $scope.q.length) {
                console.log('eller så söker vi lite...');

                $timeout(function () {
                    if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                    $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q.substring(0, 3).toLowerCase());
                    $scope.pendingPromise
                    .success(function (res) {
                        latestResults = res.games;

                        searchResults = _.filter(res.games, function (game) {
                            return _.any(game.data.tags, function (tag) {
                                return _(tag).startsWith($scope.q.toLowerCase());
                            });
                        });

                        $scope.$broadcast('searchResult', searchResults, true);
                        $scope.showQ = true;
                        console.log('och nu kom resultatet');
                    });
                }, 0);
            }
        };
    }]);

app.controller('UserHeaderCtrl', ['$scope', '$location', '$state', '$stateParams', '$rootScope', '$timeout', '$http', 'stats', 'attrs',
    function ($scope, $location, $state, $stateParams, $rootScope, $timeout, $http, stats, attrs) {
        console.log('userheader');
        $rootScope.stats = stats;
        $scope.userAttrs = attrs;
        $scope.userName = $stateParams.userName;
        $scope.stats = $rootScope.stats;
        $scope.console = $rootScope.stats[0].id;

        if ($location.$$path.split('/').length === 3) {
            if ($rootScope.stats.length) {
                $location.path('/user/' + $stateParams.userName + '/' + $rootScope.stats[0].id + '/').replace();
            }
        }

        $scope.$on('consoleChanged', function (event, data) {
            console.log(data);
            $scope.console = data;
        });

        var latestResults = [];
        var searchResults = [];
        $scope.search = function () {

            if ($scope.q === undefined) {
                return;
            }

            if ($scope.q.length === 0) {
                $scope.$broadcast('searchResult', null, false);
                $scope.showQ = false;
                return;
            }

            var oldies = _.filter(latestResults, function (game) {
                return _.any(game.tags, function (tag) {
                    return _(tag).startsWith($scope.q);
                });
            });

            if (oldies.length === 0) {
                searchThrottled($scope);
            } else {
                searchResults = oldies;
            }
        };

        var searchDelayed = function ($scope) {
            $scope.$apply(function () { searchAction($scope); });
        };

        var searchThrottled = _.debounce(searchDelayed, 1000);

        var searchAction = function ($scope) {
            if ($scope.q !== undefined && $scope.q.length > 0) {
                console.log('eller så söker vi lite...');

                $timeout(function () {
                    if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                    $scope.pendingPromise = $http.get('/api/search/' + $scope.console + '?q=' + $scope.q.substring(0, 3).toLowerCase() + '&r=' + $scope.userName);
                    $scope.pendingPromise
                    .success(function (res) {
                        console.log(res.games);
                        latestResults = res.games;

                        searchResults = _.filter(res.games, function (game) {
                            return _.any(game.data.tags, function (tag) {
                                return _(tag).startsWith($scope.q.toLowerCase());
                            });
                        });

                        $scope.$broadcast('searchResult', searchResults, true);
                        $scope.showQ = true;
                        console.log('och nu kom resultatet');
                    });
                }, 0);
            }
        };
    }]);

app.controller('AdminHeaderCtrl', ['$scope', '$location',
    function ($scope, $location) {
        console.log('adminheader');

        if ($location.$$path.split('/').length === 2) {
            $location.path('/admin/index').replace();
        }
    }]);