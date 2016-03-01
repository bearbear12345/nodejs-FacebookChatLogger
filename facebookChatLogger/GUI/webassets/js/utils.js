String.prototype.replaceAll = function(find, replace) {
  /* Replace all existences of _find_ with _replace_ */
  return this.replace(new RegExp(find, 'g'), replace);
};