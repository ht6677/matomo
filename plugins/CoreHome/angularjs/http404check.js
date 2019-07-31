(function () {
    angular.module('piwikApp').factory('http404CheckInterceptor', http404CheckInterceptor);

    http404CheckInterceptor.$inject = ['$q', 'globalAjaxQueue'];

    function http404CheckInterceptor($q, globalAjaxQueue) {

        function isClientError(rejection)
        {
            if (rejection.status === 500) {
                return true;
            }

            return rejection.status >= 400 && rejection.status < 408;
        }

        return {
            'request': function(config) {
                if ('object' === typeof matomoRelativeWebDirs
                    && config && config.url && config.url.indexOf('plugins/') === 0
                    && config.url.indexOf('.html') > 0
                    && config.url.indexOf('/angularjs/') > 0) {

                    var urlParts = config.url.split('/');
                    if (urlParts && urlParts.length > 2 && urlParts[1]) {
                        var pluginName = urlParts[1];
                        if (pluginName && pluginName in matomoRelativeWebDirs) {
                            config.url = matomoRelativeWebDirs[pluginName] + config.url;
                        }
                    }
                }
                return config;
            },
            'responseError': function(rejection) {

                if (rejection &&
                    isClientError(rejection) &&
                    rejection.config &&
                    rejection.config.url &&
                    -1 !== rejection.config.url.indexOf('.html') &&
                    -1 !== rejection.config.url.indexOf('plugins')) {

                    var posEndUrl = rejection.config.url.indexOf('.html') + 5;
                    var url       = rejection.config.url.substr(0, posEndUrl);

                    var message = 'Please check your server configuration. You may want to whitelist "*.html" files from the "plugins" directory.';
                    message    += ' The HTTP status code is ' + rejection.status + ' for URL "' + url + '"';

                    var UI = require('piwik/UI');
                    var notification = new UI.Notification();
                    notification.show(message, {
                        title: 'Failed to load HTML file:',
                        context: 'error',
                        id: 'Network_HtmlFileLoadingError'
                    });
                }

                return $q.reject(rejection);
            }
        };
    }

    angular.module('piwikApp').config(['$httpProvider',function($httpProvider) {
        $httpProvider.interceptors.push('http404CheckInterceptor');
    }]);


})();
