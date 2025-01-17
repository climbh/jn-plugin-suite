/**
 * 匹配所有的api名称
 * @param {*} str api文件内容
 * @returns
 */
export function matchStr(str) {
    const regex = /name:\s*'([^']+)'/g
    // 使用正则匹配并提取所有 `name` 值
    const matches = []
    let match
    while ((match = regex.exec(str)) !== null) {
        matches.push(match[1]) // match[1] 是正则捕获组中的 `name` 值
    }
    return matches
}