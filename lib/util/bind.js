/**
* Binds a function to a specific object.
*
* @example
*
*      const obj = {a: 1, b: function() { console.log(a); }};
*      const bound = utils.bind(obj, obj.b);
*      bound(); // prints 1
*
* @param {Function} fn The function to bind.
* @param {Object} cnxt The object to bind to.
* @returns {Function} The bound function.
*
* @function bind
*/
module.exports = function (fn, cnxt) {
  return function () {
    return fn.apply(cnxt, arguments);
  };
};
