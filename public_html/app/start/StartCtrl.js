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
            if (isToday(d)) {
                return 'Idag ' + (hours < 9 ? '0' + hours : hours) + ':' + date.getMinutes();
            }
            else if (isYesterday(d)) {
                return 'Igår ' + (hours < 9 ? '0' + hours : hours) + ':' + date.getMinutes();
            } else {
                return (date.getDate() + ' ' + getMonthyName(date.getMonth()) + ' ' + date.getFullYear());
            }
        }
        
        function isToday(d) {
            return (new Date(d)).setHours(0, 0, 0, 0) === (new Date()).setHours(0, 0, 0, 0);
        }

        function isYesterday(d) {
            var e = new Date();
            e.setDate(e.getDate() - 1);


            return (new Date(d)).setHours(0, 0, 0, 0) === (e.setHours(0, 0, 0, 0));
        }

        function getMonthyName(p) {
            return ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][p];
        };
    }]);