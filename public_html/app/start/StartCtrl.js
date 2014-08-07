app.controller('StartCtrl', ['$scope', '$location', '$stateParams', '$http', 'stats',
    function ($scope, $location, $stateParams, $http, stats) {
        console.log('startctrl');
        $scope.createdList = makePresentable(stats.created);
        $scope.updatedList = makePresentable(stats.updated);
        
        function makePresentable(list) {
            return _.map(list, function (item) {
                return { id: item.id, data: { name: item.value.data.name, slug: item.value.data.name.split('-').join('+').split(' ').join('-'), console: item.value.data.console, regions: { main: item.value.data.regions.main, sub: item.value.data.regions.sub } }, created: handleDate(item.value.timestamp) };
            });
        }

        function handleDate(d) {
            var date = new Date(d);
            var hours = date.getHours();
            if (isSame(d, new Date())) {
                return 'Idag ' + (hours < 9 ? '0' + hours : hours) + ':' + date.getMinutes();
            } else {
                var e = new Date();
                e.setDate(e.getDate() - 1);
                
                if (isSame(d, e)) {
                    return 'Igår ' + (hours < 9 ? '0' + hours : hours) + ':' + date.getMinutes();
                } else {
                    return (date.getDate() + ' ' + getMonthyName(date.getMonth()) + ' ' + (date.getFullYear() !== e.getFullYear() ? date.getFullYear() : ''));
                }
            }
        }
        
        function isSame(d, e) {
            return (new Date(d)).setHours(0, 0, 0, 0) === (e).setHours(0, 0, 0, 0);
        }

        function getMonthyName(p) {
            return ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][p];
        }
    }]);