/**
 * String utils
 *
 */

(function initStringUtil() {
  var polyfills = {
    /**
     * check if a string has the given subsequence
     * @param  {String} substr subsequence to search
     * @return {Boolean}        existance
     */
    contains: function(substr) {
      return this.indexOf(substr) > -1;
    },
    /**
     * strip heading and tail spaces
     * @return {String} stripped string
     */
    trim: function() {
      return this.replace(/^\s+|\s+$/g, '');
    },
    /**
     * use string as template to format with arguments
     * @return {String} rendered result
     *
     * usage: 
     *   '{0} {2} {1}'.format(1, 2, 3)
     *   '{name} is {key}'.format({name: 'foo', 'key': bar})
     *
     */
    format: function() {
      var args = arguments;
      return this.replace(/{(\w+)}/g, function(match, key) {
        return (args.length === 1 ? args[0][key] : args[key]) || match;
      });
    },
    /**
     * convert dash style id to camelcase
     * @return {String} camelcase
     */
    camel: function() {
      return this.replace(/\b+\w/g, function(match) {
        return match[match.length - 1].toUpperCase();
      })
    }
  }

  // export
  for (var polyfill in polyfills) {
    String.prototype[polyfill] = String.prototype[polyfill] || polyfills[polyfill];
  }

})();
