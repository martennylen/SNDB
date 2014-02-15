﻿app.controller('GameListCtrl', ['$scope', '$location', '$stateParams', '$http', '$timeout', 'GamesService', 'baseRegions', function ($scope, $location, $stateParams, $http, $timeout, GamesService, baseRegions) {
    console.log('gamelistctrl');

    $scope.currentRegion.subregion = $stateParams.subRegionName.length > 0 ? _.find($scope.currentRegion.region.regions, function (sr) {
        return sr.id === $stateParams.subRegionName;
    }) : baseRegions[0].regions[0];

    $scope.selected = {};
    $scope.initialResult = [];
    
    GamesService.get({ consoleName: $stateParams.consoleName, regionName: $stateParams.regionName, subRegionName: $scope.currentRegion.subregion.id }).$promise.then(function (data) {
        $scope.initialResult = data.games;
        $scope.games = data.games;
        $scope.loggedIn = data.loggedIn;
    });

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
        if ($scope.isEditing) {
            $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, variants: g.variants }));
        } else {
            if ($scope.selected.id !== g.id) {
                $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, variants: g.variants }));
                $scope.isEditing = true;
            } else {
                $scope.selected = {};
            }
        }
    };

    $scope.attrChanged = function (attrs) {
        $scope.willRemove = (_.every(_.pluck(attrs.common, 'status'), function(a) { return !a; }) && !attrs.isNew) ? true : false; 
    };

    $scope.updateGame = function (g) {
        var current = $scope.selected;

        var attrs = {
            common: _.pluck(current.attr.common, 'status'),
            extras: _.pluck(current.attr.extras, 'status'),
            note: current.attr.note
        };
        var combObj = { id: current.id, console: g.console, regions: g.regions, attr: attrs };
        
        if (current.attr.isNew) {
            $http.post('/api/user/add', combObj)
                .success(function () {
                    g.attr = current.attr;
                    g.attr.isNew = false;
                    $scope.editGame(g);
                })
                .error(function () {
                    console.log('HIELP');
                });
        } else {
            if ((_.every(attrs.common, function (a) { return !a; }) && !$scope.selected.attr.isNew)) {
                console.log('vill ta bort ' + current.item);
                $scope.$emit('gameRemoved', $scope.consoleName);
                $http.post('/api/user/remove', { item: current.item })
                    .success(function () {
                        $scope.editGame(g);
                    })
                    .error(function() {
                        console.log('HIELP');
                    });
            } else {
                $http.post('/api/user/update', { item: current.item, attr: attrs })
                    .success(function() {
                        g.attr = current.attr;
                        g.attr.isComplete = _.every(_.pluck(g.attr.common, 'status')) && (g.attr.extras.length ? _.every(_.pluck(g.attr.extras, 'status')) : true);
                        console.log(g.attr.isComplete);
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
        if ($scope.q !== undefined) {
            console.log('eller så söker vi lite...');

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q.substring(0,3).toLowerCase());
                $scope.pendingPromise
                .success(function (res) {
                    latestResults = res.games;
                    $scope.games = _.filter(res.games, function(game) {
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