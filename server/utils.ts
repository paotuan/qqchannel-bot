// https://www.zhangxinxu.com/wordpress/2021/01/dom-api-html-encode-decode/
export function unescapeHTML(str: string) {
  return str.replace(/&lt;|&gt;|&amp;/g, function (matches) {
    return ({
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&'
    })[matches] || ''
  })
}
