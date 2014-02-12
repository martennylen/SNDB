app.controller('UserListCtrl', ['$scope', '$location', '$stateParams', '$http', '$timeout', 'baseRegions',
    function ($scope, $location, $stateParams, $http, $timeout, baseRegions) {
    console.log('userlistctrl');
    $scope.userName = $stateParams.userName;
    $scope.consoleName = $stateParams.consoleName;
    $scope.regionName = $stateParams.regionName;
    $scope.subRegionName = $stateParams.subRegionName;
    
    $scope.$watch('consoleName', function (newValue) {
        if (newValue !== undefined) {
            $scope.$emit('consoleChanged', newValue);
        } else {
            console.log('nu nollställer vi va');
        }
    });

    $scope.$watch('regionName', function (newValue) {
        if (newValue !== undefined) {
            $scope.$emit('regionChanged', { consoleName: $scope.consoleName, regionName: newValue });
        }
    });

    $scope.$watch('subRegionName', function (newValue) {
        if (newValue !== undefined) {
            $scope.$emit('subRegionChanged', { consoleName: $scope.consoleName, regionName: $scope.regionName, subRegionName: newValue });
        }
    });

    $scope.selected = {};
    $scope.searchResult = [];

    $scope.$on('gamesReceived', function (event, gameResponse) {
        console.log('FICK SPEL!');
        console.log(gameResponse);
        $scope.games = gameResponse.games;
        $scope.loggedIn = gameResponse.loggedIn;
    });

    //$scope.regionStats = gameResponse.regions;
    //$scope.games = gameResponse.games;
    //$scope.loggedIn = gameResponse.loggedIn;

    //UserGamesService.get({ userName: $stateParams.userName, consoleName: $stateParams.consoleName }).$promise.then(function (data) {
    //    $scope.games = data.games;
    //    $scope.loggedIn = data.loggedIn;
    //});

    $scope.regions = baseRegions;
    $scope.currentRegion = {
        region: _.find($scope.regions, function (r) {
            return r.id === $scope.regionName;
        })
    };
    //$stateParams.regionName = $scope.currentRegion.region.id;
    //$scope.filterBoxes = {};

    //_.each($scope.regions, function (f) {
    //    $scope.filterBoxes[f.id] = f.selected;
    //});

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        if (!$scope.loggedIn) {
            return;
        }
        $scope.isEditing = !$scope.isEditing;
        if ($scope.isEditing) {
            $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, attr: g.attr }));
        } else {
            if ($scope.selected.id !== g.id) {
                $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, attr: g.attr }));
                $scope.isEditing = true;
            } else {
                $scope.selected = {};
            }
        }
    };

    $scope.attrChanged = function (attrs) {
        $scope.willRemove = (_.every(_.pluck(attrs, 'status'), function (a) { return !a; }) && !$scope.selected.attr.isNew) ? true : false;
    };

    $scope.updateGame = function (g) {
        var current = $scope.selected;
        var obj = {
            common: _.pluck(current.attr.common, 'status'),
            extras: _.pluck(current.attr.extras, 'status'),
            note: current.attr.note
        };

        if (current.attr.isNew) {
            $http.post('/api/user/add', { id: current.id, console: $stateParams.consoleName, attr: obj })
                .success(function () {
                    g.attr = current.attr;
                    g.attr.isNew = false;
                    $scope.editGame(g);
                })
                .error(function () {
                    console.log('HIELP');
                });
        } else {
            if ((_.every(obj.common, function (a) { return !a; }) && !$scope.selected.attr.isNew)) {
                console.log('vill ta bort ' + current.item);
                $scope.$emit('gameRemoved', $scope.consoleName);
                $http.post('/api/user/remove', { item: current.item })
                    .success(function () {
                        if ($scope.userName !== undefined) {
                            g.isRemoved = true;
                            $scope.$emit('gameRemoved', $scope.consoleName);
                        }
                        $scope.editGame(g);
                    })
                    .error(function () {
                        console.log('HIELP');
                    });
            } else {
                $http.post('/api/user/update', { item: current.item, attr: obj })
                    .success(function () {
                        g.attr = current.attr;
                        g.attr.isComplete = _.every(_.pluck(g.attr.common, 'status')) && (g.attr.extras.length ? _.every(_.pluck(g.attr.extras, 'status')) : true);
                        console.log(g.attr.isComplete);
                        $scope.editGame(g);
                    })
                    .error(function () {
                        console.log('HIELP');
                    });
            }
        }
    };

    $scope.isDirty = function (attrs) {
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.attr));
    };

    var latestResults = [];
    $scope.search = function () {
        if ($scope.q === undefined) {
            return;
        }

        if ($scope.q.length === 0) {
            $scope.games = gameResponse.games;
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
            $scope.games = oldies;
        }
    };

    var searchDelayed = function ($scope) {
        $scope.$apply(function () { searchAction($scope); });
    };

    var searchThrottled = _.debounce(searchDelayed, 1000);

    var searchAction = function ($scope) {
        if ($scope.q !== undefined) {
            console.log('eller så söker vi lite...');

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q.substring(0, 3).toLowerCase() + '&r=' + $scope.userName);
                $scope.pendingPromise
                .success(function (res) {
                    latestResults = res.games;
                    $scope.games = _.filter(res.games, function (game) {
                        return _.any(game.tags, function (tag) {
                            return _(tag).startsWith($scope.q.toLowerCase());
                        });
                    });
                    $scope.showQ = true;
                    console.log('och nu kom resultatet');
                });
            }, 0);
        }
    };
}]);