﻿app.controller('UserListCtrl', function ($scope, $location, $stateParams, $http, $timeout, baseRegions, gameResponse) {
    console.log('userlistctrl');
    $scope.consoleName = $stateParams.consoleName;
    $scope.selected = {};
    
    $scope.games = gameResponse.games;
    $scope.showControls = gameResponse.showControls;

    $scope.$watch('consoleName', function (newValue) {
        if (newValue.length) {
            $scope.$emit('consoleChanged', newValue);
        }
    });

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });

    //$scope.userName = $stateParams.userName;

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        if (!$scope.showControls) {
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

    $scope.updateGame = function (g) {
        var obj = {
            common: _.pluck(current.attr.common, 'status'),
            extras: _.pluck(current.attr.extras, 'status'),
            note: current.attr.note
        };

        $http.post('/api/user/update', { item: current.item, attrs: obj })
            .success(function () {
                g.attr = current.attr;
                $scope.editGame(g);
            })
            .error(function () {
                console.log('HIELP');
            });
    };

    $scope.isDirty = function (attrs) {
        console.log('anropas');
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.attr));
    };

    $scope.search = function () {
        if ($scope.q === undefined) {
            return;
        }

        if ($scope.q.length === 0) {
            $scope.games = gameResponse.games;
            $scope.showQ = false;
            return;
        }

        if ($scope.q.length < latestSearchQuery.length) {
            $scope.games = _.filter($scope.games, function (game) {
                return _.any(game.tags, function (tag) {
                    return _(tag).startsWith($scope.q);
                });
            });
        } else {
            searchThrottled($scope);
        }
    };

    var latestSearchQuery = '';

    var searchDelayed = function ($scope) {
        $scope.$apply(function () { searchAction($scope); });
    };

    var searchThrottled = _.debounce(searchDelayed, 1000);

    var searchAction = function ($scope) {
        if ($scope.q !== undefined) {
            console.log('eller så söker vi lite...');
            latestSearchQuery = $scope.q;

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q);
                $scope.pendingPromise.
                success(function (res) {
                    $scope.games = res.games;
                    $scope.showQ = true;
                    console.log('och nu kom resultatet');
                });
            }, 0);
        }
    };
});