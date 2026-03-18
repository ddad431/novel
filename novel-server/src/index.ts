import 'dotenv/config';
import express from 'express';
import route from './routes';
import cors from 'cors';

const PORT = process.env.PORT;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use(route);

// TODO: 错误处理中间件 (必须放在所有路由之后)

app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
})
