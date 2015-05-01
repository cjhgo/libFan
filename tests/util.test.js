describe('String utils: ', function() {
  it('string functions should work', function() {
    var str = '  The quick brown fox jumps over the lazy dog  ';
    expect(str.trim()).toBe('The quick brown fox jumps over the lazy dog');
    expect(str.contains('dog')).toBe(true);
    expect('{0} {2} {1}'.format(1,2,3)).toBe('1 3 2');
    expect('this-is-a-test'.camel()).toBe('thisIsATest');
  });
})