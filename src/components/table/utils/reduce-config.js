let notAtomConfigTypes = ['array', 'object', 'group', 'colors', 'menu', 'modal', 'rangeColor'];
export function reduceConfig(config) {
  if (!Array.isArray(config)) {
    return config;
  }
  return config.reduce((result, item) => {
    result[item.name] = item.type && !notAtomConfigTypes.includes(item.type) ? item.value : reduceConfig(item.value);
    return result;
  }, {});
}

// 用于解析3.15之前的老版本带下划线的配置
export function reduceConfigWithUndeline(config) {
  if (!Array.isArray(config)) {
    return config;
  }
  return config.reduce((result, item) => {
    result[item._name] = item._type && !notAtomConfigTypes.includes(item._type) ? item._value : reduceConfigWithUndeline(item._value);
    return result;
  }, {});
}