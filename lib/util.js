exports.genRandomStr = () => Math.random().toString(36).substr(2, 10)

exports.getPositiveNumOr0 = num => (!Number.isNaN(num) && num >= 0 ? num : 0)
