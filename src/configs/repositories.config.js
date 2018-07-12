import indexedDb from '../implements/repositories/indexedDB/index';

export default {
    namespace: 'persistence.repositories',
    configs: [
        { id: 'indexedDB', object: indexedDb }
    ]
}