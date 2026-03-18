// 知识点
// - Partial<T> 部分属性类型
// - for ... in 用来迭代对象的可枚举字符串属性
// - for ... in 会迭代原型链上的属性，所以我们需要借助 hasOwnProperty 原型方法检测属性是否是当前对象自身的属性
// - hasOwnProperty 方法可能意外失效
//   1) 对象使用不规范或者恶意代码添加同名属性 hasOwnProperty，覆盖了原本的 hasOwnProperty 方法
//   2）对象可能本身没有 hasOwnProperty 方法，该方法是继承自 Object 原型的，但是有些对象可能没有原型（Object.create(null, {...} 创建的对象）
// - 合并过程中不能覆盖原本 default(target) 对象的值，必须在每次递归调用时进行浅复制（不用深克隆，我们还递归呢）
// - source[key] 可能为 null/undefined，这种情况，我们也可以用来覆盖默认值（不过，会破坏 result[key] = source[key] 的类型推断）
// - result[key] 可能为 null/undefined, Object.getPrototypeOf(result[key]) 前需要检查
// - Object.getPrototypeOf 的具体情况：0）null/undefined 直接报错 2）原始类型会得到对应包装类型的原型 3）其他对象，得到对应的原型
// 
// TODO
// - result[key] = _merge(result[key], source[key]); 类型错误
// - result[key] = source[key]; 类型错误

/** 
 * Pure 对象合并
 */
export function _merge<T extends Object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (result[key] && Object.getPrototypeOf(result[key]) === Object.prototype) {
                // @ts-ignore
                result[key] = _merge(result[key], source[key]);
            }
            else {
                // @ts-ignore
                result[key] = source[key];
            }
        }
    }

    return result;
}