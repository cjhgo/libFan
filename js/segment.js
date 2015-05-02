(function(context) {
  'use strict';

  var api = 'http://www.ftphp.com/scws/api.php';
  var exec = function exec(string) {
    return new Promise(function(resolve, reject) {
      var param = {
        data: string.toString(),
        respond: 'json'
      };

      $.post('http://www.ftphp.com/scws/api.php', param, undefined, 'json')
        .fail(reject).success(function(data) {
          if (data.status === 'ok') {
            resolve(data.words);
          } else {
            reject(new Error(data.message));
          }
        });
    })
  };

  var Segment = {
    /**
     * execute a segment task
     * @param  {String} string string snippet to handle
     * @return {Promise}
     */
    exec: exec,
    /**
     * return a simple list
     * @param  {String} string string snippet to handle
     * @return {Promise}        
     */
    split: function(string) {
      return new Promise(function(resolve, reject) {
        exec(string).then(function(list) {
          resolve(list.map(function(e) {
            return e.word;
          }));
        }, reject);
      });
    }
  };

  if (typeof exports !== 'undefined') {
    module.exports = Segment;
  } else {
    context.Segment = Segment;
  }

})(this);
