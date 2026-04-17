import type { Line, Page, ReaderConfig } from './type';

export function calcPagesV3(_title: string, paragraphs: string[], options: ReaderConfig) {
    const { page, title, paragraph } = options; 


    // TODO：lines 需要在传入前 trimStart, trimEnd.

    // 章（多页）
    const pages: Line[][] = [];

    // 页（多行）
    let lines: Line[] = [];

    // 行（多字）
    let lwidth: number = 0;
    let lchars: string[] = [];

    // 行最少字符数：全部都是汉字的情况下。
    // - 快速获取行（不需要字符累加）
    const minTLineChras = Math.floor(page.width / title.size);  // NOTE: 向下取整。向上取整会导致有时多出子一个字符，进而出现文本超宽，软换行。
    const minPLineChars = Math.floor(page.width / paragraph.size);

    let paragraphLineNums = 0;
    let paragraphNums = 0;

    // 页最少行数
    // - 首页最少行数（
    // - 普通页最少行数（我们不知道有
    // 
    // 行数的计算是基于
    // - 首页 （title 行数 + title gap + 普通行数 + 段数）
    // - 非首页 （段数、普通行数） 
    
    // 标题分行
    if (_title.length <= minTLineChras) {
        lines.push({ text: _title, type: 'title-last-line'});
    }
    else {
        for (const char of _title) {
            const cwidth = getCharWidth({font: title.font, size: title.size, char});
         
            if (lwidth + cwidth > page.width) {
                lines.push({ text: lchars.join('') , type: 'title-line'});
                lchars = [char];    // NOTE：别忘了这个字符，这个字符没被纳入行
                lwidth = cwidth;    // NOTE：别忘了这个字符的宽度
            }
            else {
                lwidth += cwidth;
                lchars.push(char);
            }
        }
        if (lchars.length > 0) {
            lines.push({ text: lchars.join('') , type: 'title-last-line' });
            lwidth = 0;
            lchars = [];
        } 
    }

    // 标题所占高度
    // - TODO：需要考虑标题单独成页
    const theight = lines.length * (title.size * title.ratio) + title.bgap;

    // 段落分行，聚行成页
    for (let i = 0; i < paragraphs.length; ++i) {
        const _paragraph = paragraphs[i];
        if (_paragraph.length <= minPLineChars) {
            lines.push({ text: _paragraph , type: 'paragraph-last-line', pid: i });  // NOTE：id 是段落 id，不要写错
            paragraphNums++;
            paragraphLineNums++;
            addPage();  // NOTE: 每次有新行的时候都要检查（或许可以优化？）
            continue;
        }
       
        for (const char of _paragraph)  {
            const cwidth = getCharWidth({font: paragraph.font, size: paragraph.size, char});

            if (lwidth + cwidth > page.width) {
                lines.push({ text: lchars.join(''), type: 'paragraph-line', pid: i });
                paragraphLineNums++;
                lchars = [char];
                lwidth = cwidth; 
                addPage();
            }
            else {
                lwidth += cwidth;
                lchars.push(char);
            }
        }
        if (lchars.length > 0) {
            lines.push({ text: lchars.join('') , type: 'paragraph-last-line', pid: i }); 
            paragraphNums++;
            paragraphLineNums++;
            lwidth = 0;
            lchars = [];
            addPage();
        }
        
        function addPage() {
            // const plnum = pages.length === 0 ? lines.filter(l => l.type.startsWith('paragraph')).length : lines.length;
            // const pnum = lines.filter(l => l.type === 'paragraph-last-line').length || 0;
            const pheight = paragraphLineNums * (paragraph.ratio * paragraph.size) + paragraphNums * paragraph.gap;
            const height = pages.length === 0 ? pheight + theight : pheight;

            if (height > page.height) {
                // 空白行处理
                // - 我们不应该改变最后一行与上一行的间距（即上一段落的 gap，自身的 lineheight)
                // - 我们只在最后一行是段最后一行的情况下舍去段间距
                // 
                const lastLine = lines[lines.length-1];
                if (lastLine.type === 'paragraph-last-line' && height - paragraph.gap <= page.height) {
                    lastLine.type = 'paragraph-line';
                    paragraphNums -= 1;
                    return;
                }

                const _last = lines.splice(-1, 1);
                pages.push(lines);
                lines = _last;

                lwidth = 0;
                lchars = [];
                paragraphNums = 0;
                paragraphLineNums = 1;
            }
        }
       
    }
    if (lines.length > 0) {
        pages.push(lines);
    }

    return pages;
}

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
let cache: Record<string, Record<number, Record<string, number>>> = {};
const chars: Set<string> = new Set([
    ...'“”—·'.split(''),
    ...'0123456789'.split(''),
    ...'abcdefghijklmnopqrstuvwxyz'.split(''),
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ...'!@#$%^&*()-_=+'.split(''),
    ...'()[]{}<>'.split(''),
    ...'|/\\'.split(''),
    ...',.?:;\'"'.split(''),
    ...'~.'.split(''),
    ' ', // 别忘了空白字符
]);

function getCharWidth({font, size, char}: {font: string, size: number, char: string}): number {
    if (!chars.has(char)) {
        return size;
    }

    if (!cache?.[font]?.[size]?.[char]) {
        updateCache(font, size);
    }
    return cache[font][size][char];
}

function updateCache(font: string, size: number) {
    if (cache[font] && cache[font][size]) {
        return;
    }

    const result: Record<string, number> = {};
    
    ctx.font = `${size}px ${font}`;
    chars.forEach(char => result[char] = ctx.measureText(char).width);

    cache[font] ||= {};
    cache[font][size] = result;
}

export function clearCacheV3() {
    cache = {};
}