import qa from '../testData/envConfig/qa.json';
import dev from '../testData/envConfig/dev.json';
import stage from '../testData/envConfig/stage.json';

export class EnvManager {
    public static getTestData() {
        const env = process.env.TEST_ENV || 'qa';

        switch (env.toLowerCase()) {
            case 'dev': return dev;
            case 'stage': return stage;
            case 'qa': return qa;
            default:
                console.warn(`Environment '${env}' not found, defaulting to 'qa'`);
                return qa;
        }
    }
}
