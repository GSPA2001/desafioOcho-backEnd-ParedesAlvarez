import dotenv from 'dotenv';

dotenv.config();

const config = {
    //MONGOOSE_URL: process.env.MONGOOSE_URI,
    githubAuth: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CLIENT_CALLBACK,
    }
};

export default config;