describe('Segment API', function() {
  it('should recognize the sentense and return an array', function(done) {
    Segment.split('你和谁结伴前来，是否比我精彩').then(function(data) {
      expect(data).toContain('精彩');
      done();
    });
  });
})
