import { EnvManager } from './EnvManager';

const envData = EnvManager.getTestData();

import data from '../testData/data.json';


export const TestData = {
    user: {
        username: envData.credentials.username,
        password: envData.credentials.password
    },
    messages: data.messages,
    labels: data.labels,
    defaults: data.defaults,
    roleValidation: data.roleValidation,

    generateEmployee: () => {
        const randomId = Math.floor(Math.random() * 100000).toString();
        return {
            firstName: data.defaults.firstName,
            lastName: `User_${randomId}`,
            id: randomId
        };
    }
};
