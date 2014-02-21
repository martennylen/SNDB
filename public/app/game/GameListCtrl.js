app.controller('GameListCtrl', ['$scope', '$location', '$stateParams', '$http', '$timeout', 'GamesService', 'baseRegions', function ($scope, $location, $stateParams, $http, $timeout, GamesService, baseRegions) {
    console.log('gamelistctrl');

    $scope.currentRegion.subregion = $stateParams.subRegionName.length > 0 ? _.find($scope.currentRegion.region.regions, function (sr) {
        return sr.id === $stateParams.subRegionName;
    }) : baseRegions[0].regions[0];

    $scope.selected = {};
    $scope.initialResult = [];

    var docid = '';
    var skip = 0;
    var lastResult = {};
    var lastGameName = '';
    $scope.isFetching = false;
    $scope.reachedEnd = false;
    
    $scope.getGames = function () {
        if ($scope.isFetching || $scope.reachedEnd) {
            return;
        }
        $scope.isFetching = true;
        GamesService.get({ consoleName: $stateParams.consoleName, regionName: $stateParams.regionName, subRegionName: $scope.currentRegion.subregion.id, gameName:lastGameName, docid: docid, skip: skip }).$promise.then(function (data) {
            if (!_.isEmpty(lastResult)) {
                $scope.initialResult.push(lastResult);
            }

            if (data.games.length < 21) {
                $scope.initialResult = $scope.initialResult.concat(data.games);
                $scope.reachedEnd = true;
            } else {
                $scope.initialResult = $scope.initialResult.concat(_.initial(data.games));
                lastResult = _.last(data.games);
                lastGameName = lastResult.data.name;
                docid = lastResult.id;
                skip = 1;
            }
            $scope.games = $scope.initialResult;
            $scope.loggedIn = data.loggedIn;
            $scope.isFetching = false;
        });
    };

    $scope.$watch('consoleName', function (newValue) {
        if (newValue.length) {
            $scope.$emit('consoleChanged', newValue);
        }
    });

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        if (!$scope.loggedIn) {
            return;
        }
        $scope.isEditing = !$scope.isEditing;
        var attrs = _.map(g.data.variants, function (v) {
            return _.pluck(v.attr.common, 'status');
        });
        console.log(attrs);
        if ($scope.isEditing) {
            $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, variants: g.data.variants, attrs: attrs, isNew: g.isNew }));
            console.log($scope.selected);
        } else {
            if ($scope.selected.id !== g.id) {
                $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, variants: g.data.variants, attrs: attrs, isNew: g.isNew }));
                $scope.isEditing = true;
            } else {
                $scope.selected = {};
            }
        }
    };

    $scope.attrChanged = function (variant, attr, status) {
        $scope.selected.attrs[variant][attr] = status;
        $scope.willRemove = !$scope.selected.isNew && mapCheckboxAttributes($scope.selected.attrs);
    };

    $scope.updateGame = function (g) {
        var current = $scope.selected;
        var attrs = _.map(current.variants, function(v, i) {
            return { common: current.attrs[i], extras: v.attr.extras, note: v.attr.note };
        });
        var combObj = { id: current.id, console: g.data.console, regions: g.data.regions, attr: attrs };

        if (current.isNew) {
            console.log('lägger till!');
            $http.post('/api/user/add', combObj)
                .success(function (item) {
                    g.item = item;
                    g.data.variants = current.variants;
                    _.each(g.data.variants, function (v) {
                        v.isComplete = _.every(_.pluck(v.attr.common, 'status')) && (v.attr.extras.length ? _.every(_.pluck(v.attr.extras, 'status')) : true);
                    });
                    g.isComplete = _.every(_.pluck(g.data.variants, 'isComplete'));
                    g.isNew = false;
                    $scope.editGame(g);
                })
                .error(function () {
                    console.log('HIELP');
                });
        } else {
            if (mapCheckboxAttributes(current.attrs)) {
                console.log('vill ta bort ' + current.item);
                $scope.$emit('gameRemoved', $scope.consoleName);
                $http.post('/api/user/remove', { item: current.item })
                    .success(function () {
                        g.data.variants = current.variants;
                        g.isComplete = false;
                        g.isNew = true;
                        $scope.editGame(g);
                    })
                    .error(function() {
                        console.log('HIELP');
                    });
            } else {
                $http.post('/api/user/update', { item: current.item, attr: attrs })
                    .success(function () {
                        g.data.variants = current.variants;
                        _.each(g.data.variants, function(v) {
                            v.isComplete = _.every(_.pluck(v.attr.common, 'status')) && (v.attr.extras.length ? _.every(_.pluck(v.attr.extras, 'status')) : true);
                        });

                        g.isComplete = _.every(_.pluck(g.data.variants, 'isComplete'));
                        $scope.editGame(g);
                    })
                    .error(function() {
                        console.log('HIELP');
                    });
            }
        }
    };

    $scope.isDirty = function (attrs) {
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.variants));
    };

    function mapCheckboxAttributes(attrs) {
        var flat = _.reduceRight(attrs, function (a, b) { return a.concat(b); }, []);
        return _.every(flat, function (a) { return !a; });
    }

    var latestResults = [];
    $scope.search = function () {
        if ($scope.q === undefined) {
            return;
        }
        
        if ($scope.q.length === 0) {
            //$scope.games = gameResponse.games;
            $scope.games = $scope.initialResult;
            $scope.showQ = false;
            return;
        }

        var oldies = _.filter(latestResults, function(game) {
            return _.any(game.tags, function(tag) {
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
        if ($scope.q !== undefined && $scope.q.length) {
            console.log('eller så söker vi lite...');

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q.substring(0,3).toLowerCase());
                $scope.pendingPromise
                .success(function (res) {
                    latestResults = res.games;
                    $scope.games = _.filter(res.games, function(game) {
                        return _.any(game.data.tags, function (tag) {
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