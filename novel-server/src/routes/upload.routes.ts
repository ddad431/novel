import { Router } from 'express';
import { handleUploadReceive, handleUploadMerge } from '../controllers';
import { uploadMiddleware, validateMiddleware } from '../middlewares';
import { UploadRequestSchema, UploadMergeRequestSchema } from '../models/schemas';

const uploadRouter = Router();

// POST /upload
uploadRouter.post('/', uploadMiddleware, validateMiddleware(UploadRequestSchema), handleUploadReceive);
// POST /upload/merge
uploadRouter.post('/merge', validateMiddleware(UploadMergeRequestSchema), handleUploadMerge);

export default uploadRouter;