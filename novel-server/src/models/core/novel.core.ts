export type Novel = {
    /** 小说来源 （本地为 '本地'，书源为爬取网站名）*/
    source: string,

    /** 小说网站 (本地为 'local', 书源为爬取网站 origin */
    origin: string,

    /** 小说 ID （本地为生成的 ID，书源为爬取的小说 ID）*/
    id: string,

    /** 小说书名（本地为上传的文件名，书源为爬取的小说名*/
    name: string,

    /** 小说作者 */
    author: string,

    /** 小说简介 */
    desc: string,

    /** 小说封面（本地为 '', 书源为爬取的封面地址）*/
    cover: string,

    /** 小说状态 (TODO: 可能书源获取的 state 是 '连载中' 这种，可能需要一些额外的转换？) */
    status: '连载' | '完结' | '本地',

    /** 小说分类 (TODO: 可能书源获取的小说的有多个 tag？*/
    tag: string,
};

export type LocalNovel = Novel & { 
    /** 小说总章节数 （配置本地的 process 显示进度）*/
    total: number,
}

export type NovelCatalog = Array<{
    /** 章节 ID（本地为生成的自增 ID，书源为爬取的小说章节 ID */
    cid: string,

    /** 章节标题 */
    title: string,
}>;

export type NovelChapter = string[];