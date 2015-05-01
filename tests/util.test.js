describe('String utils: ', function() {
  it('string functions should work', function() {
    var str = '  The quick brown fox jumps over the lazy dog  ';
    expect(str.trim()).toBe('The quick brown fox jumps over the lazy dog');
    expect(str.contains('dog')).toBeTruthy();
    expect('{0} {2} {1}'.format(1,2,3)).toBe('1 3 2');
    expect('this-is-a-test'.camel()).toBe('thisIsATest');

    var str2 = 'To be, or not to be, that is the question.';
    expect(str2.startsWith('To be')).toBeTruthy();
    expect(str2.startsWith('not to be')).not.toBeTruthy();
    expect(str2.startsWith('not to be', 10)).toBeTruthy();
    expect(str2.endsWith('question.')).toBeTruthy();
    expect(str2.endsWith('to be')).not.toBeTruthy();
    expect(str2.endsWith('to be', 19)).toBeTruthy();
  });
})