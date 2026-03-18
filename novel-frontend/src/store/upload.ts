type BookUploadInfo = {
    name: string,
    size: number
};

type BookUploadRecord = Array<BookUploadInfo>;

export const UploadStore = {
    isBookUploaded,
    getBookUploadRecord,
    updateBooklUploadRecord,
};

function isBookUploaded(file: File): boolean {
    const uploadRecord: BookUploadRecord = getBookUploadRecord();

    if (uploadRecord.length === 0) {
        return false;
    }
    return uploadRecord.some(({ name, size }) => file.name === name && file.size === size);
}

function getBookUploadRecord(): BookUploadRecord {
    return JSON.parse(uni.getStorageSync('upload') || '[]');
}

function updateBooklUploadRecord(file: File): boolean {
    const uploadRecord: BookUploadRecord = getBookUploadRecord();

    try {
        uploadRecord.push({ name: file.name, size: file.size });
        uni.setStorageSync('upload', JSON.stringify(uploadRecord));

        return true;
    }
    catch (err) {
        console.log(err);

        return false;
    }
}