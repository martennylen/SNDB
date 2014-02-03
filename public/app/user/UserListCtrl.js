﻿app.controller('UserListCtrl', function ($scope, $location, $stateParams, $http, baseRegions, gameResponse) {
    console.log('userlistctrl');
    $scope.consoleName = $stateParams.consoleName;
    $scope.games = gameResponse.games;
    $scope.showControls = gameResponse.showControls;
    $scope.$watch('consoleName', function (newValue) {
        if (newValue.length) {
            //console.log('userlistctrl fick stateparam och satte till: ' + newValue);
            $scope.$emit('consoleChanged', newValue);
            //$location.path('/user/' + $scope.userName + '/' + $scope.consoleName);
        }
    });
    //console.log($scope.consoleName);
    $scope.userName = $stateParams.userName;
    $scope.selected = {};

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });

    //$scope.games = UserGamesService.get({ userName: $scope.userName, consoleName: $scope.consoleName });
    //$scope.games.$promise.then(function (response) {
    //    $scope.games = response.items;
    //    $scope.showControls = response.showControls;
    //});

    //console.log('hämtar spel ' + $scope.consoleName);

    //$http.get('/api/user/' + $stateParams.userName + '/' + $stateParams.consoleId).success(function(response) {
    //    $scope.games = response.items;
    //    $scope.showControls = response.showControls;
    //});

    //$scope.$watch("selected", function (selected) {
    //    console.log(selected);
    //});

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

    //$scope.attrChange = function (item, level, index, status) {
    //    ng-change="attrChange(game.item, 'attr/common', $index, attr.status)"
    //    ng-change="attrChange(game.item, 'attr/extras', $index, attr.status)"
    //    ng-disabled="!isDirty(game)"
    //    $http.post('/api/user/update', { item: item, level: level, index: index, status: status }).
    //        error(function () {
    //            console.log('HIELP');
    //        });
    //};

    $scope.isDirty = function (attrs) {
        console.log('anropas');
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.attr));
    };
});