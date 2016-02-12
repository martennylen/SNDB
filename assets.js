module.exports = function (assets) {
    assets.root = __dirname;
    
    assets.addJs('/public_html/lib/jquery-2.1.0.js', 'lib');
    assets.addJs('/public_html/lib/angular.js', 'lib');
    assets.addJs('/public_html/lib/ng-infinite-scroll.js', 'lib');
    assets.addJs('/public_html/lib/angular-resource.js', 'lib');
    assets.addJs('/public_html/lib/angular-route.js', 'lib');
    assets.addJs('/public_html/lib/angular-ui-router.js', 'lib');
    assets.addJs('/public_html/lib/angular-cookies.js', 'lib');
    assets.addJs('/public_html/lib/underscore-1.4.1.js', 'lib');
    assets.addJs('/public_html/lib/underscore.string.js', 'lib');
    assets.addJs('/public_html/lib/modernizr-2.5.3', 'lib');
    
    //assets.addJs('/public_html/app/app.js', 'app');
    //assets.addJs('/public_html/app/user/*.js', 'app');
    //assets.addJs('/public_html/app/game/*.js', 'app');
    //assets.addJs('/public_html/app/account/*.js', 'app');
    //assets.addJs('/public_html/app/admin/*.js', 'app');
}