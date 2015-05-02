describe('Search functionalities', function() {
  var ujs = new Huiwen({
    baseUrl: 'huiwen.ujs.edu.cn:8080',
    name: '江苏大学图书馆'
  });
  var sdu = new Huiwen({
    baseUrl: 'http://58.194.172.34/',
    name: '山东大学图书馆',
    ver: '5.0'
  });

  it('should handle V4.5', function(done) {
    expect(ujs.baseUrl).toBe('http://huiwen.ujs.edu.cn:8080/');
    expect(ujs.ver).toBe('4.5');

    ujs.search('redis').then(function(data) {
      expect(data.total).toBeGreaterThan(0);
      done();
    });
  });

  it('should handle general search in V5.0', function(done) {
    sdu.search('php').then(function(data) {
      expect(data.total).toBeGreaterThan(0);
      expect('list' in data).toBeTruthy();
      expect(data.list.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should handle fetch book by isbn in V5.0', function(done) {
    sdu.book('7-89494-000-3').then(function(data) {
      expect(data.title).toBe('黑客大曝光:网络安全机密与解决方案');
      expect(data.type).toBe('中文图书');
      done();
    });
  })

  it('should reject invalid versions', function() {
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
  })

});
