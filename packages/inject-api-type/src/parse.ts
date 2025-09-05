import fs from 'node:fs/promises'
import path from 'node:path'
import type { IComment, Parse } from './types'


/**
 * 解析文件
 * @param filePath 文件路径
 * @returns
 */

export async function parseFile(filePath: string): Promise<Parse[]> {
  const content = await fs.readFile(filePath, 'utf-8')
  return extractObjectsWithComments(content)
}
function extractObjectsWithComments(code: string) {
  const results = [];

  // 第一步：匹配文件中所有的对象（包括数组中的对象）
  const objectRegex = /{[\s\S]*?}(?=\s*[,}\]]|$)/g;

  let objectMatch;
  const allObjects = [];

  // 收集所有对象及其位置
  while ((objectMatch = objectRegex.exec(code)) !== null) {
    allObjects.push({
      start: objectMatch.index,
      end: objectMatch.index + objectMatch[0].length,
      content: objectMatch[0],
      fullMatch: objectMatch[0]
    });
  }

  // 第二步：为每个对象分别提取注释和name
  let beforeStart = 0
  for (const obj of allObjects) {
    // 提取对象前面的注释
    const textBeforeObject = code.substring(0 + beforeStart, obj.start);
    const comment = cleanBlockComment(textBeforeObject);
    // 从对象内容中提取name
    const name = extractNameFromObject(textBeforeObject);
    beforeStart = obj.start
    if (name) {
      results.push({
        comment: comment,
        apiName: name,
      });
    }
  }
  return results;
}

function extractCommentBeforeObject(textBefore: string) {
  // 从后往前查找最近的注释
  const lines = textBefore.split('\n');

  // 从最后一行开始向前查找
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();

    if (!line) continue; // 跳过空行

    // 匹配行注释
    if (line.startsWith('//')) {
      return line.replace('//', '').trim();
    }

    // 匹配块注释（在行尾）
    if (line.endsWith('*/')) {
      // 找到块注释的开始
      const blockStartIndex = textBefore.lastIndexOf('/*');
      if (blockStartIndex !== -1) {
        const blockComment = textBefore.substring(blockStartIndex).trim();
        return cleanBlockComment(blockComment);
      }
    }

    // 如果遇到非注释内容，停止查找
    if (!line.startsWith('//') && !line.includes('/*') && !line.includes('*/')) {
      break;
    }
  }

  return '';
}

function extractNameFromObject(objectContent: string) {
  // 从对象内容中提取name属性
  const nameMatch = objectContent.match(/name:\s*['"]([^'"]+)['"]/);
  return nameMatch ? nameMatch[1] : null;
}

function cleanBlockComment(comment: string) {
  const regex = /\/\/\s*(.+)/g;  // 匹配注释

  const matches = [];
  let m;
  while ((m = regex.exec(comment)) !== null) {
    matches.push(m[1].trim()); // 去掉多余空格
  }
  return matches.at(-1)
}