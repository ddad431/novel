-- CreateTable
CREATE TABLE `Novel` (
    `source` VARCHAR(191) NOT NULL,
    `origin` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `cover` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,
    `total` INTEGER NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`origin`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NovelCatalog` (
    `content` JSON NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `novelOrigin` VARCHAR(191) NOT NULL,
    `novelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`novelOrigin`, `novelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NovelChapter` (
    `cid` VARCHAR(191) NOT NULL,
    `content` JSON NOT NULL,
    `createAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `novelId` VARCHAR(191) NOT NULL,
    `novelOrigin` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`novelOrigin`, `novelId`, `cid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NovelCatalog` ADD CONSTRAINT `NovelCatalog_novelOrigin_novelId_fkey` FOREIGN KEY (`novelOrigin`, `novelId`) REFERENCES `Novel`(`origin`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NovelChapter` ADD CONSTRAINT `NovelChapter_novelOrigin_novelId_fkey` FOREIGN KEY (`novelOrigin`, `novelId`) REFERENCES `Novel`(`origin`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE;
