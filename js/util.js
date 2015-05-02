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
        var lookup = args.length === 1 && typeof args[0] === 'object' ? args[0] : args;
        if (!lookup) console.log(args, arguments);
        return lookup.hasOwnProperty(key) ? lookup[key] : match;
      });
    },
    /**
     * convert dash style id to camelcase
     * @return {String} camelcase
     */
    camel: function() {
      return this.replace(/\b[^\w]\b\w/g, function(match, index) {
        return match[match.length - 1].toUpperCase();
      });
    },
    /**
     * determine whether or not a string begins with another string
     * @param  {Integer} position     Optional. The position 
     *                                in this string at which to begin searching for searchString; 
     *                                defaults to 0.
     * @return {Boolean} 
     */
    startsWith: function(searchString, position) {
      position = position || 0;
      return this.lastIndexOf(searchString, position) === position;
    },

    /**
     * determine whether or not a string ends with another string
     * @param  {String} searchString The characters to be searched for at the end of this string.
     * @param  {Integer} position     Optional. The position 
     *                                in this string at which to begin searching for searchString; 
     *                                defaults to 0.
     * @return {Boolean}              result
     */
    endsWith: function(searchString, position) {
      if (position === undefined || position > this.length) {
        position = this.length;
      }
      position -= searchString.length;
      var lastIndex = this.indexOf(searchString, position);
      return lastIndex > -1 && lastIndex === position;
    }

  }

  // export
  for (var polyfill in polyfills) {
    String.prototype[polyfill] = String.prototype[polyfill] || polyfills[polyfill];
  }

})();
