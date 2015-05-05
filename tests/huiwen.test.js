jasmine.DEFAULT_TIMEOUT_INTERVAL = 100 * 1000;

describe('Search functionalities', function() {
  var ujs = new Huiwen({
    baseUrl: 'huiwen.ujs.edu.cn:8080',
    title: '江苏大学图书馆'
  });
  var sdu = new Huiwen({
    baseUrl: 'http://58.194.172.34/',
    title: '山东大学图书馆',
    ver: '5.0'
  });

  it('should handle search in V4.5', function(done) {
    expect(ujs.baseUrl).toBe('http://huiwen.ujs.edu.cn:8080/');
    expect(ujs.ver).toBe('4.5');

    ujs.search('redis').then(function(data) {
      expect(data.total).toBeGreaterThan(0);
      done();
    });
  });

  it('should handle search in V5.0', function(done) {
    sdu.search('php').then(function(data) {
      expect(data.total).toBeGreaterThan(0);
      expect('list' in data).toBeTruthy();
      expect(data.list.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should fetch book by isbn', function(done) {
    sdu.book('7-89494-000-3').then(function(data) {
      expect(data.title).toBe('黑客大曝光:网络安全机密与解决方案');
      expect(data.type).toBe('中文图书');
    }).then(function() {
      sdu.book('9787560926995').then(null, function() {
        done();
      });
    });
  });

  it('should reject invalid version', function() {
    expect(function() {
      new Huiwen({
        ver: 666
      });
    }).toThrow();
  });

  it('should read top keywords', function(done) {
    sdu.topKeywords().then(function(keywords) {
      expect(keywords).not.toBeNull();
      return ujs.topKeywords().then(function(keywords) {
        expect(keywords).not.toBeNull();
        done();
      });
    });
  });

  it('should read notifications', function(done) {
    ujs.rss('5633076452300768556200300736546556665265', 3).then(function(data) {
      expect('title' in data).toBeTruthy();
      expect('list' in data).toBeTruthy();
      done();
    });
  });

  // note: the following test cases requires manually login

  it('should fetch user id', function(done) {
    ujs.id().then(function(id) {
      expect(/\w{40}/.test(id)).toBeTruthy();
      done();
    });
  });

  it('should handle book history', function(done) {
    ujs.history().then(function(data) {
      expect(+data[0].no).toBe(1);
      done();
    });
  });

});
